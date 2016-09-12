*** Settings ***
Documentation  Reusable keywords and variables for the StoryMap server.
Library        Selenium2Library
Library        Process
Library        String

*** Variables ***
${SERVER}      http://localhost:5000
${BROWSER}     Firefox
${DELAY}       0
${ROOT URL}    ${SERVER}/select/

*** Keywords ***
Start Test Server
    Start Process  bash -c "source env.sh && TEST_MODE\=on fab serve"  shell=yes stdout=server.log  stderr=server.log  alias=test_server
    Sleep  3s

Stop Test Server
    Terminate Process  test_server
    Close Browser

Open Browser To Authoring Tool
    Open Browser  ${ROOT URL}  ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed  ${DELAY}
    Authoring Tool Should Be Open

Authoring Tool Should Be Open
    Title Should Be  StoryMap JS

Create StoryMap
    [Arguments]  ${name}
    Create StoryMap Should Be Visible
    Input Text  css=input.entry-create-title  ${name}
    Click Link  id=entry_create
    Wait Until Loaded
    #wait for page title to be updated.
    Sleep  1sec
    StoryMap Should Be Open  ${name}

Create StoryMap Should Be Visible
    Page Should Contain  Let's make a StoryMap.

Create Another StoryMap
    [Arguments]  ${name}
    Go To  ${SERVER}/select
    Wait Until Loaded
    #sleep to wait for modal to drop down
    Sleep  1sec
    Click Link  css=#new_storymap
    Create StoryMap  ${name}

StoryMap Should Be Open
    [Arguments]  ${name}
    Title Should Be  ${name} (Editing)

StoryMap Should Exist
    [Arguments]  ${name}
    Element Should Contain  css=#entry_modal .modal-body  ${name}

StoryMap Should Not Exist
    [Arguments]  ${name}
    Element Should Not Contain  css=#entry_modal .modal-body  ${name}

Delete storymap
    [Arguments]  ${name}
    #sleep one second here just to be sure
    Sleep  1sec
    Page Should Contain  ${name}
    ${id} =  Convert To Lowercase  ${name}
    Click Link  css=tr[storymap-data="${id}"] td div div a
    #use jquery to click the delete button incase it's off the bottom of the screen
    Execute Javascript  $(".dropdown.open a.list-item-delete").click()
    Click Button  css=.modal-confirm button.btn-primary
    StoryMap Should Not Exist  ${name}

Wait Until Loaded
    Wait Until Element Is Not Visible  css=.icon-spinner
