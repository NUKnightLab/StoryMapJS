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
