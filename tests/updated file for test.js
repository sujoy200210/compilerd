const axios = require('axios');
const { testCases } = require('./data/testJson');
const { describe, expect, it } = require('@jest/globals');

const ENDPOINT = process.env.ENDPOINT || 'http://localhost:3000/api/execute/';

describe('Tests', () => {
  for (const testCase of testCases) {
    it(testCase.name, async () => {
      const response = await axios.post(ENDPOINT, testCase.reqObject);

      if (typeof response.data.output === 'object') {
        expect(response.data.output.score).toBeDefined();
        expect(response.data.output.rationale.positives).toBeDefined();
        expect(response.data.output.rationale.negatives).toBeDefined();
        expect(response.data.output.points).toBeDefined();
      } else {
        expect(response).toHaveProperty('data.output', testCase.expectedResponse.val);
      }

      expect(response).toHaveProperty('status', testCase.expectedResponse.status);
      expect(response).toHaveProperty('data.error', testCase.expectedResponse.error);
    }, 15000);
  }

  // New Test Cases

  it('Empty Request Body', async () => {
    const response = await axios.post(ENDPOINT, {});
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.data.error).toBeDefined();
  });

  it('Invalid JSON Request Body', async () => {
    try {
      await axios.post(ENDPOINT, 'invalid_json_data', { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      expect(error.response.status).toBeGreaterThanOrEqual(400);
      expect(error.response.data.error).toBeDefined();
    }
  });

  it('Large Request Body', async () => {
    const largeData = { code: ' '.repeat(100000) }; // Simulate a large data object
    const response = await axios.post(ENDPOINT, largeData);
    expect(response.status).toBeLessThan(500);
    // Add additional assertions based on your API's behavior for large data
  });

  it('Invalid Code Syntax', async () => {
    const testCase = {
      name: 'Invalid Code Syntax',
      reqObject: { code: '//thier are error in codes' },
      expectedResponse: {
        status: 400,
        error: 'Syntax error in code',
      },
    };
    const response = await axios.post(ENDPOINT, testCase.reqObject);
    expect(response.status).toEqual(testCase.expectedResponse.status);
    expect(response.data.error).toMatch(testCase.expectedResponse.error);
  });

  it('Valid Code Execution', async () => {
    const testCase = {
      name: 'Valid Code Execution',
      reqObject: { code: 'console.log("Hi!");' },
      expectedResponse: {
        status: 200,
        output: 'Hi!',
      },
    };
    const response = await axios.post(ENDPOINT, testCase.reqObject);
    expect(response.status).toEqual(testCase.expectedResponse.status);
    expect(response.data.output).toBe(testCase.expectedResponse.output);
  });

  it('Missing Required Fields', async () => {
    const testCase = {
      name: 'Required Fields are Missing',
      reqObject: { /* missing fields */ },
      expectedResponse: {
        status: 400,
        error: '',
      },
    };
    const response = await axios.post(ENDPOINT, testCase.reqObject);
    expect(response.status).toEqual(testCase.expectedResponse.status);
    expect(response.data.error).toMatch(testCase.expectedResponse.error);
  });

  it('Unsupported Language', async () => {
    const testCase = {
      name: 'Unsupported Language',
      reqObject: { code: 'print("Hello!")', language: 'python' },
      expectedResponse: {
        status: 400,
        error: 'Unsupported language',
      },
    };
    const response = await axios.post(ENDPOINT, testCase.reqObject);
    expect(response.status).toEqual(testCase.expectedResponse.status);
    expect(response.data.error).toMatch(testCase.expectedResponse.error);
  });

  it('Performance Under Load', async () => {
    const testCases = Array.from({ length: 100 }, (_, i) => axios.post(ENDPOINT, { code: `console.log(${i});` }));
    const responses = await Promise.all(testCases);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('Boundary Values', async () => {
    const testCase = {
      name: 'Boundary Values',
      reqObject: { code: ' '.repeat(1024) }, // Adjust size to the boundary limit
      expectedResponse: {
        status: 200,
        output: 'error exists',
      },
    };
    const response = await axios.post(ENDPOINT, testCase.reqObject);
    expect(response.status).toEqual(testCase.expectedResponse.status);
    expect(response.data.output).toBe(testCase.expectedResponse.output);
  });
});
