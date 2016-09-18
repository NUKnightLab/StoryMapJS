*** Settings ***
Documentation   Suite of tests for creating, updating and deleting new storymaps.
Suite Setup     Start Test Server
Suite Teardown  Run Keywords  Stop Test Server  Close All Browsers
Resource        resource.robot

*** Test Cases ***
Create StoryMap
    Open Browser To Authoring Tool
    Create StoryMap  Test

Delete StoryMap
    Open Browser To Authoring Tool
    Wait Until Loaded
    Delete StoryMap  Test

Create And Delete Multiple StoryMaps
    Open Browser To Authoring Tool
    Create StoryMap  Test1
    Create Another StoryMap  Test2
    Create Another StoryMap  SomeOtherVeryDifferentName
    Go To  ${SERVER}/select
    Delete StoryMap  Test2
    StoryMap Should Exist  Test1
    StoryMap Should Exist  SomeOtherVeryDifferentName
    Delete StoryMap  SomeOtherVeryDifferentName
    StoryMap Should Exist  Test1
    Delete StoryMap  Test1
    StoryMap Should Not Exist  Test1
    StoryMap Should Not Exist  Test2
    StoryMap Should Not Exist  SomeOtherVeryDifferentName

Rename A StoryMap
    Open Browser To Authoring Tool
    Create StoryMap  Test1
    StoryMap Should Exist  Test1
    Rename StoryMap  Test1  Test2
    StoryMap Should Not Exist  Test1
    StoryMap Should Exist  Test2
