"""Unit tests for StoryMapJS Flask API endpoints."""
import json
import os
from pathlib import Path

import pytest

# Ensure environment is configured for Flask before importing the app module
os.environ.setdefault('FLASK_SETTINGS_MODULE', 'tests.mock_settings')
os.environ.setdefault(
    'FLASK_SETTINGS_FILE',
    str(Path(__file__).resolve().with_name('flask_test_config.py')),
)

import storymap.api as api
import storymap.storage as storage


@pytest.fixture
def api_client(monkeypatch):
    """Provide a Flask test client with a seeded storymap user."""
    test_user = {
        'uid': 'user-123',
        'name': 'Test User',
        'storymaps': {
            'map-123': {
                'id': 'map-123',
                'title': 'Demo Map',
                'draft_on': '2024-01-01T00:00:00Z',
                'published_on': None,
            }
        },
    }

    monkeypatch.setattr(api, 'db', lambda: None)
    monkeypatch.setattr(
        api,
        'get_user',
        lambda uid, db=None: test_user if uid == test_user['uid'] else None,
    )
    monkeypatch.setattr(api, 'save_user', lambda user, db=None: None)
    monkeypatch.setattr(api, '_utc_now', lambda: '2024-01-02T00:00:00Z')

    with api.app.test_client() as client:
        with client.session_transaction() as session:
            session['uid'] = test_user['uid']
        yield client, test_user


@pytest.mark.unit
def test_storymap_save_retries_on_transient_storage_error(api_client, monkeypatch):
    """Ensure the save endpoint retries once before surfacing a storage failure."""
    client, _ = api_client

    payload = {'slides': []}
    attempts = {'count': 0}

    def flaky_save_json(key_name, content):
        attempts['count'] += 1
        if attempts['count'] == 1:
            raise api.storage.StorageException('transient failure', 'mock timeout')

    monkeypatch.setattr(api.storage, 'save_json', flaky_save_json)

    response = client.post(
        '/storymap/save/', data={'id': 'map-123', 'd': json.dumps(payload)}
    )

    assert response.status_code == 200
    body = response.get_json()

    assert 'meta' in body
    assert body['meta']['draft_on'] == '2024-01-02T00:00:00Z'
    assert attempts['count'] == 2, 'save_json should retry after a transient failure'


@pytest.mark.unit
def test_save_from_data_wraps_unexpected_exceptions(monkeypatch):
    """Verify storage layer surfaces unexpected errors as StorageException."""

    class ExplodingConn:
        def put_object(self, *args, **kwargs):
            raise Exception('boom')

    monkeypatch.setattr(storage, '_conn', ExplodingConn())

    with pytest.raises(storage.StorageException):
        storage.save_from_data('storymaps/demo.json', 'application/json', '{}')


@pytest.mark.unit
def test_storymap_save_returns_user_friendly_error_after_retries(api_client, monkeypatch):
    """Ensure exhausted retries surface a helpful JSON error payload."""

    client, _ = api_client
    attempts = {'count': 0}

    def always_fail_save_json(key_name, content):
        attempts['count'] += 1
        raise storage.StorageException('transient failure', 'mock timeout')

    monkeypatch.setattr(storage, 'save_json', always_fail_save_json)

    response = client.post(
        '/storymap/save/', data={'id': 'map-123', 'd': json.dumps({'slides': []})}
    )

    assert response.status_code == 200
    body = response.get_json()

    assert body['error'] == 'Unable to save StoryMap after multiple attempts. Please try again.'
    assert body['error_detail'] == 'mock timeout'
    assert body['error_type'] == 'transient failure'
    assert body['error_attempts'] == 2
    assert attempts['count'] == 2
