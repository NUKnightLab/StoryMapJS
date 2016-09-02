*** Settings ***
Documentation   Runner for the JavaScript QUnit tests.
Suite Setup     Start Test Server
Suite Teardown  Stop Test Server
Resource        resource.robot

*** Test Cases ***
Run QUnit
    Open Browser  ${SERVER}/qunit.html
    Wait Until Page Contains  Tests completed
    ${failed count} =  Execute Javascript  return parseInt($('#qunit-testresult .failed').text())
    ${tests failed} =  Set Variable  ${failed count} != ${0}

    Run Keyword If  ${tests failed}  Capture Page Screenshot
    Run Keyword If  ${tests failed}  Fail  ${failed count} QUnit tests failed.
