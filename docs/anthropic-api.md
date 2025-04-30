Using the API
Getting started
​
Accessing the API
The API is made available via our web Console. You can use the Workbench to try out the API in the browser and then generate API keys in Account Settings. Use workspaces to segment your API keys and control spend by use case.

​
Authentication
All requests to the Anthropic API must include an x-api-key header with your API key. If you are using the Client SDKs, you will set the API when constructing a client, and then the SDK will send the header on your behalf with every request. If integrating directly with the API, you’ll need to send this header yourself.

​
Content types
The Anthropic API always accepts JSON in request bodies and returns JSON in response bodies. You will need to send the content-type: application/json header in requests. If you are using the Client SDKs, this will be taken care of automatically.

​
Response Headers
The Anthropic API includes the following headers in every response:

request-id: A globally unique identifier for the request.

anthropic-organization-id: The organization ID associated with the API key used in the request.

​
Examples
curl
Python
TypeScript
Install via npm:


npm install @anthropic-ai/sdk
TypeScript

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'my_api_key', // defaults to process.env["ANTHROPIC_API_KEY"]
});

const msg = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
});
console.log(msg);

Using the API
IP addresses
Anthropic services live at a fixed range of IP addresses. You can add these to your firewall to open the minimum amount of surface area for egress traffic when accessing the Anthropic API and Console. These ranges will not change without notice.

​
IPv4
160.79.104.0/23

​
IPv6
2607:6bc0::/48

Using the API
Versions
When making API requests, you must send an anthropic-version request header. For example, anthropic-version: 2023-06-01. If you are using our client libraries, this is handled for you automatically.

For any given API version, we will preserve:

Existing input parameters
Existing output parameters
However, we may do the following:

Add additional optional inputs
Add additional values to the output
Change conditions for specific error types
Add new variants to enum-like output values (for example, streaming event types)
Generally, if you are using the API as documented in this reference, we will not break your usage.

​
Version history
We always recommend using the latest API version whenever possible. Previous versions are considered deprecated and may be unavailable for new users.

2023-06-01
New format for streaming server-sent events (SSE):
Completions are incremental. For example, " Hello", " my", " name", " is", " Claude." instead of " Hello", " Hello my", " Hello my name", " Hello my name is", " Hello my name is Claude.".
All events are named events, rather than data-only events.
Removed unnecessary data: [DONE] event.
Removed legacy exception and truncated values in responses.
2023-01-01: Initial release.

Errors
​
HTTP errors
Our API follows a predictable HTTP error code format:

400 - invalid_request_error: There was an issue with the format or content of your request. We may also use this error type for other 4XX status codes not listed below.

401 - authentication_error: There’s an issue with your API key.

403 - permission_error: Your API key does not have permission to use the specified resource.

404 - not_found_error: The requested resource was not found.

413 - request_too_large: Request exceeds the maximum allowed number of bytes.

429 - rate_limit_error: Your account has hit a rate limit.

500 - api_error: An unexpected error has occurred internal to Anthropic’s systems.

529 - overloaded_error: Anthropic’s API is temporarily overloaded.

Sudden large increases in usage may lead to an increased rate of 529 errors. We recommend ramping up gradually and maintaining consistent usage patterns.

When receiving a streaming response via SSE, it’s possible that an error can occur after returning a 200 response, in which case error handling wouldn’t follow these standard mechanisms.

​
Error shapes
Errors are always returned as JSON, with a top-level error object that always includes a type and message value. For example:

JSON

{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "The requested resource could not be found."
  }
}
In accordance with our versioning policy, we may expand the values within these objects, and it is possible that the type values will grow over time.

​
Request id
Every API response includes a unique request-id header. This header contains a value such as req_018EeWyXxfu5pfWkrYcMdjWG. When contacting support about a specific request, please include this ID to help us quickly resolve your issue.

Our official SDKs provide this value as a property on top-level response objects, containing the value of the x-request-id header:


Python

TypeScript

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const message = await client.messages.create({
  model: 'claude-3-7-sonnet-20250219',
  max_tokens: 1024,
  messages: [
    {"role": "user", "content": "Hello, Claude"}
  ]
});
console.log('Request ID:', message._request_id);
​
Long requests
We highly encourage using the streaming Messages API or Message Batches API for long running requests, especially those over 10 minutes.

We do not recommend setting a large max_tokens values without using our streaming Messages API or Message Batches API:

Some networks may drop idle connections after a variable period of time, which can cause the request to fail or timeout without receiving a response from Anthropic.
Networks differ in reliablity; our Message Batches API can help you manage the risk of network issues by allowing you to poll for results rather than requiring an uninterrupted network connection.
If you are building a direct API integration, you should be aware that setting a TCP socket keep-alive can reduce the impact of idle connection timeouts on some networks.

Our SDKs will validate that your non-streaming Messages API requests are not expected to exceed a 10 minute timeout and also will set a socket option for TCP keep-alive.

Anthropic TypeScript API Library
NPM version npm bundle size

This library provides convenient access to the Anthropic REST API from server-side TypeScript or JavaScript.

The REST API documentation can be found on docs.anthropic.com. The full API of this library can be found in api.md.

Installation
npm install @anthropic-ai/sdk
Usage
The full API of this library can be found in api.md.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const message = await client.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  });

  console.log(message.content);
}

main();
Streaming responses
We provide support for streaming responses using Server Sent Events (SSE).

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const stream = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
  model: 'claude-3-5-sonnet-latest',
  stream: true,
});
for await (const messageStreamEvent of stream) {
  console.log(messageStreamEvent.type);
}
If you need to cancel a stream, you can break from the loop or call stream.controller.abort().

Request & Response types
This library includes TypeScript definitions for all request params and response fields. You may import and use them like so:

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const params: Anthropic.MessageCreateParams = {
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  };
  const message: Anthropic.Message = await client.messages.create(params);
}

main();
Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

Counting Tokens
You can see the exact usage for a given request through the usage response property, e.g.

const message = await client.messages.create(...)
console.log(message.usage)
// { input_tokens: 25, output_tokens: 13 }
Streaming Helpers
This library provides several conveniences for streaming messages, for example:

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function main() {
  const stream = anthropic.messages
    .stream({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Say hello there!',
        },
      ],
    })
    .on('text', (text) => {
      console.log(text);
    });

  const message = await stream.finalMessage();
  console.log(message);
}

main();
Streaming with client.messages.stream(...) exposes various helpers for your convenience including event handlers and accumulation.

Alternatively, you can use client.messages.create({ ..., stream: true }) which only returns an async iterable of the events in the stream and thus uses less memory (it does not build up a final message object for you).

Message Batches
This SDK provides beta support for the Message Batches API under the client.beta.messages.batches namespace.

Creating a batch
Message Batches takes an array of requests, where each object has a custom_id identifier, and the exact same request params as the standard Messages API:

await anthropic.beta.messages.batches.create({
  requests: [
    {
      custom_id: 'my-first-request',
      params: {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hello, world' }],
      },
    },
    {
      custom_id: 'my-second-request',
      params: {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hi again, friend' }],
      },
    },
  ],
});
Getting results from a batch
Once a Message Batch has been processed, indicated by .processing_status === 'ended', you can access the results with .batches.results()

const results = await anthropic.beta.messages.batches.results(batch_id);
for await (const entry of results) {
  if (entry.result.type === 'succeeded') {
    console.log(entry.result.message.content)
  }
}
Tool use beta
This SDK provides beta support for tool use, aka function calling. More details can be found in the documentation.

AWS Bedrock
We provide support for the Anthropic Bedrock API through a separate package.

Handling errors
When the library is unable to connect to the API, or if the API returns a non-success status code (i.e., 4xx or 5xx response), a subclass of APIError will be thrown:

async function main() {
  const message = await client.messages
    .create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello, Claude' }],
      model: 'claude-3-5-sonnet-latest',
    })
    .catch(async (err) => {
      if (err instanceof Anthropic.APIError) {
        console.log(err.status); // 400
        console.log(err.name); // BadRequestError
        console.log(err.headers); // {server: 'nginx', ...}
      } else {
        throw err;
      }
    });
}

main();
Error codes are as followed:

Status Code	Error Type
400	BadRequestError
401	AuthenticationError
403	PermissionDeniedError
404	NotFoundError
422	UnprocessableEntityError
429	RateLimitError
>=500	InternalServerError
N/A	APIConnectionError
Request IDs
For more information on debugging requests, see these docs

All object responses in the SDK provide a _request_id property which is added from the request-id response header so that you can quickly log failing requests and report them back to Anthropic.

const message = await client.messages.create({ max_tokens: 1024, messages: [{ role: 'user', content: 'Hello, Claude' }], model: 'claude-3-5-sonnet-latest' });
console.log(message._request_id) // req_018EeWyXxfu5pfWkrYcMdjWG
Retries
Certain errors will be automatically retried 2 times by default, with a short exponential backoff. Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict, 429 Rate Limit, and >=500 Internal errors will all be retried by default.

You can use the maxRetries option to configure or disable this:

// Configure the default for all requests:
const client = new Anthropic({
  maxRetries: 0, // default is 2
});

// Or, configure per-request:
await client.messages.create({ max_tokens: 1024, messages: [{ role: 'user', content: 'Hello, Claude' }], model: 'claude-3-5-sonnet-latest' }, {
  maxRetries: 5,
});
Timeouts
By default requests time out after 10 minutes. However if you have specified a large max_tokens value and are not streaming, the default timeout will be calculated dynamically using the formula:

const minimum = 10 * 60;
const calculated = (60 * 60 * maxTokens) / 128_000;
return calculated < minimum ? minimum * 1000 : calculated * 1000;
which will result in a timeout up to 60 minutes, scaled by the max_tokens parameter, unless overriden at the request or client level.

You can configure this with a timeout option:

// Configure the default for all requests:
const client = new Anthropic({
  timeout: 20 * 1000, // 20 seconds (default is 10 minutes)
});

// Override per-request:
await client.messages.create({ max_tokens: 1024, messages: [{ role: 'user', content: 'Hello, Claude' }], model: 'claude-3-5-sonnet-latest' }, {
  timeout: 5 * 1000,
});
On timeout, an APIConnectionTimeoutError is thrown.

Note that requests which time out will be retried twice by default.

Long Requests
Important

We highly encourage you use the streaming Messages API for longer running requests.

We do not recommend setting a large max_tokens values without using streaming. Some networks may drop idle connections after a certain period of time, which can cause the request to fail or timeout without receiving a response from Anthropic.

This SDK will also throw an error if a non-streaming request is expected to be above roughly 10 minutes long. Passing stream: true or overriding the timeout option at the client or request level disables this error.

An expected request latency longer than the timeout for a non-streaming request will result in the client terminating the connection and retrying without receiving a response.

When supported by the fetch implementation, we set a TCP socket keep-alive option in order to reduce the impact of idle connection timeouts on some networks.

Auto-pagination
List methods in the Anthropic API are paginated. You can use the for await … of syntax to iterate through items across all pages:

async function fetchAllBetaMessagesBatches(params) {
  const allBetaMessagesBatches = [];
  // Automatically fetches more pages as needed.
  for await (const betaMessageBatch of client.beta.messages.batches.list({ limit: 20 })) {
    allBetaMessagesBatches.push(betaMessageBatch);
  }
  return allBetaMessagesBatches;
}
Alternatively, you can request a single page at a time:

let page = await client.beta.messages.batches.list({ limit: 20 });
for (const betaMessageBatch of page.data) {
  console.log(betaMessageBatch);
}

// Convenience methods are provided for manually paginating:
while (page.hasNextPage()) {
  page = await page.getNextPage();
  // ...
}
Default Headers
We automatically send the anthropic-version header set to 2023-06-01.

If you need to, you can override it by setting default headers on a per-request basis.

Be aware that doing so may result in incorrect types and other unexpected or undefined behavior in the SDK.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const message = await client.messages.create(
  {
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  },
  { headers: { 'anthropic-version': 'My-Custom-Value' } },
);
Advanced Usage
Accessing raw Response data (e.g., headers)
The "raw" Response returned by fetch() can be accessed through the .asResponse() method on the APIPromise type that all methods return.

You can also use the .withResponse() method to get the raw Response along with the parsed data.

const client = new Anthropic();

const response = await client.messages
  .create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  })
  .asResponse();
console.log(response.headers.get('X-My-Header'));
console.log(response.statusText); // access the underlying Response object

const { data: message, response: raw } = await client.messages
  .create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  })
  .withResponse();
console.log(raw.headers.get('X-My-Header'));
console.log(message.content);
Making custom/undocumented requests
This library is typed for convenient access to the documented API. If you need to access undocumented endpoints, params, or response properties, the library can still be used.

Undocumented endpoints
To make requests to undocumented endpoints, you can use client.get, client.post, and other HTTP verbs. Options on the client, such as retries, will be respected when making these requests.

await client.post('/some/path', {
  body: { some_prop: 'foo' },
  query: { some_query_arg: 'bar' },
});
Undocumented request params
To make requests using undocumented parameters, you may use // @ts-expect-error on the undocumented parameter. This library doesn't validate at runtime that the request matches the type, so any extra values you send will be sent as-is.

client.foo.create({
  foo: 'my_param',
  bar: 12,
  // @ts-expect-error baz is not yet public
  baz: 'undocumented option',
});
For requests with the GET verb, any extra params will be in the query, all other requests will send the extra param in the body.

If you want to explicitly send an extra argument, you can do so with the query, body, and headers request options.

Undocumented response properties
To access undocumented response properties, you may access the response object with // @ts-expect-error on the response object, or cast the response object to the requisite type. Like the request params, we do not validate or strip extra properties from the response from the API.

Customizing the fetch client
By default, this library uses node-fetch in Node, and expects a global fetch function in other environments.

If you would prefer to use a global, web-standards-compliant fetch function even in a Node environment, (for example, if you are running Node with --experimental-fetch or using NextJS which polyfills with undici), add the following import before your first import from "Anthropic":

// Tell TypeScript and the package to use the global web fetch instead of node-fetch.
// Note, despite the name, this does not add any polyfills, but expects them to be provided if needed.
import '@anthropic-ai/sdk/shims/web';
import Anthropic from '@anthropic-ai/sdk';
To do the inverse, add import "@anthropic-ai/sdk/shims/node" (which does import polyfills). This can also be useful if you are getting the wrong TypeScript types for Response (more details).

Logging and middleware
You may also provide a custom fetch function when instantiating the client, which can be used to inspect or alter the Request or Response before/after each request:

import { fetch } from 'undici'; // as one example
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  fetch: async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    console.log('About to make a request', url, init);
    const response = await fetch(url, init);
    console.log('Got response', response);
    return response;
  },
});
Note that if given a DEBUG=true environment variable, this library will log all requests and responses automatically. This is intended for debugging purposes only and may change in the future without notice.

Configuring an HTTP(S) Agent (e.g., for proxies)
By default, this library uses a stable agent for all http/https requests to reuse TCP connections, eliminating many TCP & TLS handshakes and shaving around 100ms off most requests.

If you would like to disable or customize this behavior, for example to use the API behind a proxy, you can pass an httpAgent which is used for all requests (be they http or https), for example:

import http from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Configure the default for all requests:
const client = new Anthropic({
  httpAgent: new HttpsProxyAgent(process.env.PROXY_URL),
});

// Override per-request:
await client.messages.create(
  {
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-3-5-sonnet-latest',
  },
  {
    httpAgent: new http.Agent({ keepAlive: false }),
  },
);
Semantic versioning
This package generally follows SemVer conventions, though certain backwards-incompatible changes may be released as minor versions:

Changes that only affect static types, without breaking runtime behavior.
Changes to library internals which are technically public but not intended or documented for external use. (Please open a GitHub issue to let us know if you are relying on such internals.)
Changes that we do not expect to impact the vast majority of users in practice.
We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

We are keen for your feedback; please open an issue with questions, bugs, or suggestions.

Requirements
TypeScript >= 4.5 is supported.

The following runtimes are supported:

Node.js 18 LTS or later (non-EOL) versions.
Deno v1.28.0 or higher.
Bun 1.0 or later.
Cloudflare Workers.
Vercel Edge Runtime.
Jest 28 or greater with the "node" environment ("jsdom" is not supported at this time).
Nitro v2.6 or greater.
Web browsers: disabled by default to avoid exposing your secret API credentials (see our help center for best practices). Enable browser support by explicitly setting dangerouslyAllowBrowser to true.
More explanation
Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open or upvote an issue on GitHub.

Messages
Send a structured list of input messages with text and/or image content, and the model will generate the next message in the conversation.

The Messages API can be used for either single queries or stateless multi-turn conversations.

Learn more about the Messages API in our user guide

POST
/
v1
/
messages

cURL

Python

JavaScript

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1024,
  messages: [
    {"role": "user", "content": "Hello, world"}
  ]
});

200

4XX

{
  "content": [
    {
      "text": "Hi! My name is Claude.",
      "type": "text"
    }
  ],
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "model": "claude-3-7-sonnet-20250219",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "input_tokens": 2095,
    "output_tokens": 503
  }
}
Headers
​
anthropic-beta
string[]
Optional header to specify the beta version(s) you want to use.

To use multiple betas, use a comma separated list like beta1,beta2 or specify the header multiple times for each beta.

​
anthropic-version
string
required
The version of the Anthropic API you want to use.

Read more about versioning and our version history here.

​
x-api-key
string
required
Your unique API key for authentication.

This key is required in the header of all API requests, to authenticate your account and access Anthropic's services. Get your API key through the Console. Each key is scoped to a Workspace.

Body
application/json
​
max_tokens
integer
required
The maximum number of tokens to generate before stopping.

Note that our models may stop before reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.

Different models have different maximum values for this parameter. See models for details.

Required range: x > 1
​
messages
object[]
required
Input messages.

Our models are trained to operate on alternating user and assistant conversational turns. When creating a new Message, you specify the prior conversational turns with the messages parameter, and the model then generates the next Message in the conversation. Consecutive user or assistant turns in your request will be combined into a single turn.

Each input message must be an object with a role and content. You can specify a single user-role message, or you can include multiple user and assistant messages.

If the final message uses the assistant role, the response content will continue immediately from the content in that message. This can be used to constrain part of the model's response.

Example with a single user message:

[{"role": "user", "content": "Hello, Claude"}]
Example with multiple conversational turns:

[
  {"role": "user", "content": "Hello there."},
  {"role": "assistant", "content": "Hi, I'm Claude. How can I help you?"},
  {"role": "user", "content": "Can you explain LLMs in plain English?"},
]
Example with a partially-filled response from Claude:

[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("},
]
Each input message content may be either a single string or an array of content blocks, where each block has a specific type. Using a string for content is shorthand for an array of one content block of type "text". The following input messages are equivalent:

{"role": "user", "content": "Hello, Claude"}
{"role": "user", "content": [{"type": "text", "text": "Hello, Claude"}]}
Starting with Claude 3 models, you can also send image content blocks:

{"role": "user", "content": [
  {
    "type": "image",
    "source": {
      "type": "base64",
      "media_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRg...",
    }
  },
  {"type": "text", "text": "What is in this image?"}
]}
We currently support the base64 source type for images, and the image/jpeg, image/png, image/gif, and image/webp media types.

See examples for more input examples.

Note that if you want to include a system prompt, you can use the top-level system parameter — there is no "system" role for input messages in the Messages API.


Show child attributes

​
model
string
required
The model that will complete your prompt.

See models for additional details and options.

Required string length: 1 - 256
​
metadata
object
An object describing metadata about the request.


Show child attributes

​
stop_sequences
string[]
Custom text sequences that will cause the model to stop generating.

Our models will normally stop when they have naturally completed their turn, which will result in a response stop_reason of "end_turn".

If you want the model to stop generating when it encounters custom strings of text, you can use the stop_sequences parameter. If the model encounters one of the custom sequences, the response stop_reason value will be "stop_sequence" and the response stop_sequence value will contain the matched stop sequence.

​
stream
boolean
Whether to incrementally stream the response using server-sent events.

See streaming for details.

​
system

string
System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our guide to system prompts.

​
temperature
number
Amount of randomness injected into the response.

Defaults to 1.0. Ranges from 0.0 to 1.0. Use temperature closer to 0.0 for analytical / multiple choice, and closer to 1.0 for creative and generative tasks.

Note that even with temperature of 0.0, the results will not be fully deterministic.

Required range: 0 < x < 1
​
thinking
object
Configuration for enabling Claude's extended thinking.

When enabled, responses include thinking content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your max_tokens limit.

See extended thinking for details.

Enabled
Disabled

Show child attributes

​
tool_choice
object
How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Auto
Any
Tool
ToolChoiceNone

Show child attributes

​
tools
object[]
Definitions of tools that the model may use.

If you include tools in your API request, the model may return tool_use content blocks that represent the model's use of those tools. You can then run those tools using the tool input generated by the model and then optionally return results back to the model using tool_result content blocks.

Each tool definition includes:

name: Name of the tool.
description: Optional, but strongly-recommended description of the tool.
input_schema: JSON schema for the tool input shape that the model will produce in tool_use output content blocks.
For example, if you defined tools as:

[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
And then asked the model "What's the S&P 500 at today?", the model might produce tool_use content blocks in the response like this:

[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
You might then run your get_stock_price tool with {"ticker": "^GSPC"} as an input, and return the following back to the model in a subsequent user message:

[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
Tools can be used for workflows that include running client-side tools and functions, or more generally whenever you want the model to produce a particular JSON structure of output.

See our guide for more details.

Custom Tool
ComputerUseTool_20241022
BashTool_20241022
TextEditor_20241022
ComputerUseTool_20250124
BashTool_20250124
TextEditor_20250124

Show child attributes

​
top_k
integer
Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses. Learn more technical details here.

Recommended for advanced use cases only. You usually only need to use temperature.

Required range: x > 0
​
top_p
number
Use nucleus sampling.

In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p. You should either alter temperature or top_p, but not both.

Recommended for advanced use cases only. You usually only need to use temperature.

Required range: 0 < x < 1
Response
200 - application/json
​
content
object[]
required
Content generated by the model.

This is an array of content blocks, each of which has a type that determines its shape.

Example:

[{"type": "text", "text": "Hi, I'm Claude."}]
If the request input messages ended with an assistant turn, then the response content will continue directly from that last turn. You can use this to constrain the model's output.

For example, if the input messages were:

[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
Then the response content might be:

[{"type": "text", "text": "B)"}]
Text
Tool Use
Thinking
Redacted Thinking

Show child attributes

​
id
string
required
Unique object identifier.

The format and length of IDs may change over time.

​
model
string
required
The model that handled the request.

Required string length: 1 - 256
​
role
enum<string>
default:
assistant
required
Conversational role of the generated message.

This will always be "assistant".

Available options: assistant 
​
stop_reason
enum<string> | null
required
The reason that we stopped.

This may be one the following values:

"end_turn": the model reached a natural stopping point
"max_tokens": we exceeded the requested max_tokens or the model's maximum
"stop_sequence": one of your provided custom stop_sequences was generated
"tool_use": the model invoked one or more tools
In non-streaming mode this value is always non-null. In streaming mode, it is null in the message_start event and non-null otherwise.

Available options: end_turn, max_tokens, stop_sequence, tool_use 
​
stop_sequence
string | null
required
Which custom stop sequence was generated, if any.

This value will be a non-null string if one of your custom stop sequences was generated.

​
type
enum<string>
default:
message
required
Object type.

For Messages, this is always "message".

Available options: message 
​
usage
object
required
Billing and rate-limit usage.

Anthropic's API bills and rate-limits by token counts, as tokens represent the underlying cost to our systems.

Under the hood, the API transforms requests into a format suitable for the model. The model's output then goes through a parsing stage before becoming an API response. As a result, the token counts in usage will not match one-to-one with the exact visible content of an API request or response.

For example, output_tokens will be non-zero, even for an empty string response from Claude.

Total input tokens in a request is the summation of input_tokens, cache_creation_input_tokens, and cache_read_input_tokens.


Hide child attributes

​
usage.cache_creation_input_tokens
integer | null
required
The number of input tokens used to create the cache entry.

Required range: x > 0
​
usage.cache_read_input_tokens
integer | null
required
The number of input tokens read from the cache.

Required range: x > 0
​
usage.input_tokens
integer
required
The number of input tokens which were used.

Required range: x > 0
​
usage.output_tokens
integer
required
The number of output tokens which were used.

Required range: x > 0

Count Message tokens
Count the number of tokens in a Message.

The Token Count API can be used to count the number of tokens in a Message, including tools, images, and documents, without creating it.

Learn more about token counting in our user guide

POST
/
v1
/
messages
/
count_tokens

cURL

Python

JavaScript

import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

await anthropic.messages.countTokens({
  model: "claude-3-7-sonnet-20250219",
  messages: [
    {"role": "user", "content": "Hello, world"}
  ]
});

200

4XX

{
  "input_tokens": 2095
}
Headers
​
anthropic-beta
string[]
Optional header to specify the beta version(s) you want to use.

To use multiple betas, use a comma separated list like beta1,beta2 or specify the header multiple times for each beta.

​
anthropic-version
string
required
The version of the Anthropic API you want to use.

Read more about versioning and our version history here.

​
x-api-key
string
required
Your unique API key for authentication.

This key is required in the header of all API requests, to authenticate your account and access Anthropic's services. Get your API key through the Console. Each key is scoped to a Workspace.

Body
application/json
​
messages
object[]
required
Input messages.

Our models are trained to operate on alternating user and assistant conversational turns. When creating a new Message, you specify the prior conversational turns with the messages parameter, and the model then generates the next Message in the conversation. Consecutive user or assistant turns in your request will be combined into a single turn.

Each input message must be an object with a role and content. You can specify a single user-role message, or you can include multiple user and assistant messages.

If the final message uses the assistant role, the response content will continue immediately from the content in that message. This can be used to constrain part of the model's response.

Example with a single user message:

[{"role": "user", "content": "Hello, Claude"}]
Example with multiple conversational turns:

[
  {"role": "user", "content": "Hello there."},
  {"role": "assistant", "content": "Hi, I'm Claude. How can I help you?"},
  {"role": "user", "content": "Can you explain LLMs in plain English?"},
]
Example with a partially-filled response from Claude:

[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("},
]
Each input message content may be either a single string or an array of content blocks, where each block has a specific type. Using a string for content is shorthand for an array of one content block of type "text". The following input messages are equivalent:

{"role": "user", "content": "Hello, Claude"}
{"role": "user", "content": [{"type": "text", "text": "Hello, Claude"}]}
Starting with Claude 3 models, you can also send image content blocks:

{"role": "user", "content": [
  {
    "type": "image",
    "source": {
      "type": "base64",
      "media_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRg...",
    }
  },
  {"type": "text", "text": "What is in this image?"}
]}
We currently support the base64 source type for images, and the image/jpeg, image/png, image/gif, and image/webp media types.

See examples for more input examples.

Note that if you want to include a system prompt, you can use the top-level system parameter — there is no "system" role for input messages in the Messages API.


Show child attributes

​
model
string
required
The model that will complete your prompt.

See models for additional details and options.

Required string length: 1 - 256
​
system

string
System prompt.

A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our guide to system prompts.

​
thinking
object
Configuration for enabling Claude's extended thinking.

When enabled, responses include thinking content blocks showing Claude's thinking process before the final answer. Requires a minimum budget of 1,024 tokens and counts towards your max_tokens limit.

See extended thinking for details.

Enabled
Disabled

Show child attributes

​
tool_choice
object
How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

Auto
Any
Tool
ToolChoiceNone

Show child attributes

​
tools
object[]
Definitions of tools that the model may use.

If you include tools in your API request, the model may return tool_use content blocks that represent the model's use of those tools. You can then run those tools using the tool input generated by the model and then optionally return results back to the model using tool_result content blocks.

Each tool definition includes:

name: Name of the tool.
description: Optional, but strongly-recommended description of the tool.
input_schema: JSON schema for the tool input shape that the model will produce in tool_use output content blocks.
For example, if you defined tools as:

[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
And then asked the model "What's the S&P 500 at today?", the model might produce tool_use content blocks in the response like this:

[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
You might then run your get_stock_price tool with {"ticker": "^GSPC"} as an input, and return the following back to the model in a subsequent user message:

[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
Tools can be used for workflows that include running client-side tools and functions, or more generally whenever you want the model to produce a particular JSON structure of output.

See our guide for more details.

Custom Tool
ComputerUseTool_20241022
BashTool_20241022
TextEditor_20241022
ComputerUseTool_20250124
BashTool_20250124
TextEditor_20250124

Show child attributes

Response
200 - application/json
​
input_tokens
integer
required
The total number of tokens across the provided list of messages, system prompt, and tools.

Model	Anthropic API	Claude 3.5 Sonnet v2	claude-3-5-sonnet-20241022 (claude-3-5-sonnet-latest)