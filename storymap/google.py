"""
google drive
"""
import httplib2
from apiclient.discovery import build
from oauth2client.client import OAuth2WebServerFlow, OAuth2Credentials
from apiclient import errors


def get_credentials(credentials_json):
    """
    Build credentials object from json
    """
    return OAuth2Credentials.from_json(credentials_json)

#
# user info
#
   
def get_userinfo_service(credentials):
    return build(serviceName='oauth2', version='v2', 
                http=credentials.authorize(httplib2.Http()))

def get_userinfo(service):
    try:
        return service.userinfo().get().execute()
    except errors.HttpError, e:
        raise Exception(str(e))
            
#
# drive
#

def _filter_shared(resource):
    return 'sharedWithMeDate' not in resource

def get_drive_service(credentials):
    return build('drive', 'v2', http=credentials.authorize(httplib2.Http()))
    
def drive_find(service, parent_resource, title, filter_f):
    """
    Find resource with title in parent_resource
    """
    query = "title='%s' and trashed=false" % title
    if parent_resource:
        query += " and '%(id)s' in parents" % parent_resource
    response = service.files().list(q=query).execute()
    
    file_list = []
    if response and 'items' in response and response['items']:
        file_list = filter(filter_f, response['items'])
    if file_list:
        return file_list[0]
    else:
        return None

def drive_list(service, parent_id):
    """
    List resources in parent_id
    """
    query = "trashed=false and '%s' in parents" % parent_id
    response = service.files().list(q=query).execute()
    if response and 'items' in response and response['items']:
        return response['items']    
    return []
                
def drive_get_path(service, parent_resource, path_list, filter_f):
    """
    Get a resource at path_list
    """
    try:
        resource = drive_find(service, parent_resource, path_list.pop(0), filter_f)
        if not resource or not path_list:
            return resource
        return drive_get_path(service, resource, path_list, filter_f)
    except errors.HttpError, error:
        raise Exception(str(error))

def drive_get_migrate_list(service):
    parent_folder = drive_get_path(service, None, 
        ['KnightLabStoryMap', 'public'], _filter_shared)
    if not parent_folder:
        return []
    
    storymap_list = []
    
    folder_list = drive_list(service, parent_folder['id'])
    for folder in folder_list:
        draft_on = ''
        published_on = ''
        file_list = []
        
        item_list = drive_list(service, folder['id'])
        for item in item_list:
            if item['title'] == 'draft.json':
                draft_on = item['modifiedDate']
            elif item['title'] == 'published.json':
                published_on = item['modifiedDate']
        
            file_list.append(item['title'])
            
        if draft_on:
            storymap_list.append({
                'title': folder['title'],
                'url': folder['webViewLink'],
                'draft_on': draft_on,
                'published_on': published_on,
                'file_list': file_list
            })
                              
    return storymap_list
    

def drive_get_migration_diagnostics(user):
    if not 'google' in user:
        return 'No google info in user record'
    
    if not 'credentials' in user['google']:
        return 'No google credentials in user record'
    
    try:
        credentials = get_credentials(user['google']['credentials'])        
    except Exception, e:
        return 'Error getting google credentials [%s]' % str(e)
    
    try: 
        drive_service = get_drive_service(credentials)
    except Exception, e:
        return 'Error getting drive service [%s]' % str(e)
        
    try:                
        parent_folder = drive_get_path(drive_service, None, 
            ['KnightLabStoryMap', 'public'], _filter_shared)
    except Exception, e:
        return 'Error getting KnightLabStoryMap/public folder [%s]' % str(e)
        
    if not parent_folder:
        return 'KnightLabStoryMap/public folder not found'
    
    try: 
        return drive_list(drive_service, parent_folder['id'])
    except Exception, e:
        return 'Error lsiting KnightLabStoryMap/public folder [%s]' % str(e)
        
   
    
    
    
        
    