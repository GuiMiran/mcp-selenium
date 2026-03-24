import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { McpClient, getResponseText, fixture } from './mcp-client.mjs';

describe('Demo Store Automation', () => {
  let client;

  before(async () => {
    client = new McpClient();
    await client.start();
    await client.callTool('start_browser', {
      browser: 'chrome',
      options: { headless: true, arguments: ['--no-sandbox', '--disable-dev-shm-usage'] },
    });
  });

  after(async () => {
    try { await client.callTool('close_session'); } catch { /* ignore */ }
    await client.stop();
  });

  it('shows an error for invalid login', async () => {
    await client.callTool('navigate', { url: fixture('demo-store.html') });

    await client.callTool('send_keys', { by: 'id', value: 'username', text: 'locked_out' });
    await client.callTool('send_keys', { by: 'id', value: 'password', text: 'bad_password' });
    await client.callTool('interact', { action: 'click', by: 'id', value: 'login-button' });

    const result = await client.callTool('get_element_text', { by: 'id', value: 'login-error' });
    assert.equal(getResponseText(result), 'Invalid credentials');
  });

  it('completes the full purchase flow on the local demo page', async () => {
    await client.callTool('navigate', { url: fixture('demo-store.html') });

    await client.callTool('send_keys', { by: 'id', value: 'username', text: 'standard_user' });
    await client.callTool('send_keys', { by: 'id', value: 'password', text: 'secret_sauce' });
    await client.callTool('interact', { action: 'click', by: 'id', value: 'login-button' });

    let result = await client.callTool('get_element_text', { by: 'id', value: 'inventory-title' });
    assert.equal(getResponseText(result), 'Products');

    await client.callTool('interact', { action: 'click', by: 'id', value: 'add-backpack' });
    await client.callTool('interact', { action: 'click', by: 'id', value: 'add-bike-light' });

    result = await client.callTool('get_element_text', { by: 'id', value: 'cart-count' });
    assert.equal(getResponseText(result), '2');

    await client.callTool('interact', { action: 'click', by: 'id', value: 'cart-button' });
    result = await client.callTool('get_element_text', { by: 'id', value: 'cart-items' });
    assert.equal(getResponseText(result), 'Backpack, Bike Light');

    await client.callTool('interact', { action: 'click', by: 'id', value: 'checkout-button' });
    result = await client.callTool('get_element_text', { by: 'id', value: 'checkout-title' });
    assert.equal(getResponseText(result), 'Checkout: Your Information');

    await client.callTool('send_keys', { by: 'id', value: 'first-name', text: 'Guido' });
    await client.callTool('send_keys', { by: 'id', value: 'last-name', text: 'Tester' });
    await client.callTool('send_keys', { by: 'id', value: 'postal-code', text: '12345' });
    await client.callTool('interact', { action: 'click', by: 'id', value: 'continue-button' });

    result = await client.callTool('get_element_text', { by: 'id', value: 'summary-title' });
    assert.equal(getResponseText(result), 'Checkout: Overview');

    result = await client.callTool('get_element_text', { by: 'id', value: 'summary-body' });
    assert.equal(getResponseText(result), 'Backpack, Bike Light | Guido Tester | 12345');

    await client.callTool('interact', { action: 'click', by: 'id', value: 'finish-button' });
    result = await client.callTool('get_element_text', { by: 'id', value: 'complete-header' });
    assert.equal(getResponseText(result), 'Thank you for your order!');
  });
});
