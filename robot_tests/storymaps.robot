*** Settings ***
Documentation   Suite of tests for creating, updating and deleting new storymaps.
Suite Setup     Start Test Server
Suite Teardown  Stop Test Server
Resource        resource.robot

*** Test Cases ***
Create StoryMap
    Open Browser To Authoring Tool
    Create StoryMap  Test
