@smoke
@regression
@e2e
@acceptance
@guido:L2
Feature: Demo store checkout
  As a user of the demo store
  I want to log in, add products, and finish checkout
  So that the automation stack can validate an end-to-end purchase flow

  Scenario: Successful purchase from login to confirmation
    Given the user opens the GUIDO demo store
    When the user logs in with valid credentials
    And adds two products to the cart
    And completes checkout with shipping details
    Then the order confirmation is displayed

  Scenario: Invalid credentials are rejected
    Given the user opens the GUIDO demo store
    When the user attempts to log in with invalid credentials
    Then an invalid credentials message is displayed
