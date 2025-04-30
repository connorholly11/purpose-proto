Multi-round Conversation
This guide will introduce how to use the DeepSeek /chat/completions API for multi-turn conversations.

The DeepSeek /chat/completions API is a "stateless" API, meaning the server does not record the context of the user's requests. Therefore, the user must concatenate all previous conversation history and pass it to the chat API with each request.

The following code in Python demonstrates how to concatenate context to achieve multi-turn conversations.

from openai import OpenAI
client = OpenAI(api_key="<DeepSeek API Key>", base_url="https://api.deepseek.com")

# Round 1
messages = [{"role": "user", "content": "What's the highest mountain in the world?"}]
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=messages
)

messages.append(response.choices[0].message)
print(f"Messages Round 1: {messages}")

# Round 2
messages.append({"role": "user", "content": "What is the second?"})
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=messages
)

messages.append(response.choices[0].message)
print(f"Messages Round 2: {messages}")

In the first round of the request, the messages passed to the API are:

[
    {"role": "user", "content": "What's the highest mountain in the world?"}
]

In the second round of the request:

Add the model's output from the first round to the end of the messages.
Add the new question to the end of the messages.
The messages ultimately passed to the API are:

[
    {"role": "user", "content": "What's the highest mountain in the world?"},
    {"role": "assistant", "content": "The highest mountain in the world is Mount Everest."},
    {"role": "user", "content": "What is the second?"}
]

Context Caching
The DeepSeek API Context Caching on Disk Technology is enabled by default for all users, allowing them to benefit without needing to modify their code.

Each user request will trigger the construction of a hard disk cache. If subsequent requests have overlapping prefixes with previous requests, the overlapping part will only be fetched from the cache, which counts as a "cache hit."

Note: Between two requests, only the repeated prefix part can trigger a "cache hit." Please refer to the example below for more details.

Example 1: Long Text Q&A
First Request

messages: [
    {"role": "system", "content": "You are an experienced financial report analyst..."}
    {"role": "user", "content": "<financial report content>\n\nPlease summarize the key information of this financial report."}
]


Second Request

messages: [
    {"role": "system", "content": "You are an experienced financial report analyst..."}
    {"role": "user", "content": "<financial report content>\n\nPlease analyze the profitability of this financial report."}
]


In the above example, both requests have the same prefix, which is the system message + <financial report content> in the user message. During the second request, this prefix part will count as a "cache hit."

Example 2: Multi-round Conversation
First Request

messages: [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is the capital of China?"}
]

Second Request

messages: [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is the capital of China?"},
    {"role": "assistant", "content": "The capital of China is Beijing."},
    {"role": "user", "content": "What is the capital of the United States?"}
]

In this example, the second request can reuse the initial system message and user message from the first request, which will count as a "cache hit."

Example 3: Using Few-shot Learning
In practical applications, users can enhance the model's output performance through few-shot learning. Few-shot learning involves providing a few examples in the request to allow the model to learn a specific pattern. Since few-shot generally provides the same context prefix, the cost of few-shot is significantly reduced with the support of context caching.

First Request

messages: [    
    {"role": "system", "content": "You are a history expert. The user will provide a series of questions, and your answers should be concise and start with `Answer:`"},
    {"role": "user", "content": "In what year did Qin Shi Huang unify the six states?"},
    {"role": "assistant", "content": "Answer: 221 BC"},
    {"role": "user", "content": "Who was the founder of the Han Dynasty?"},
    {"role": "assistant", "content": "Answer: Liu Bang"},
    {"role": "user", "content": "Who was the last emperor of the Tang Dynasty?"},
    {"role": "assistant", "content": "Answer: Li Zhu"},
    {"role": "user", "content": "Who was the founding emperor of the Ming Dynasty?"},
    {"role": "assistant", "content": "Answer: Zhu Yuanzhang"},
    {"role": "user", "content": "Who was the founding emperor of the Qing Dynasty?"}
]


Second Request

messages: [    
    {"role": "system", "content": "You are a history expert. The user will provide a series of questions, and your answers should be concise and start with `Answer:`"},
    {"role": "user", "content": "In what year did Qin Shi Huang unify the six states?"},
    {"role": "assistant", "content": "Answer: 221 BC"},
    {"role": "user", "content": "Who was the founder of the Han Dynasty?"},
    {"role": "assistant", "content": "Answer: Liu Bang"},
    {"role": "user", "content": "Who was the last emperor of the Tang Dynasty?"},
    {"role": "assistant", "content": "Answer: Li Zhu"},
    {"role": "user", "content": "Who was the founding emperor of the Ming Dynasty?"},
    {"role": "assistant", "content": "Answer: Zhu Yuanzhang"},
    {"role": "user", "content": "When did the Shang Dynasty fall?"},        
]


In this example, 4-shots are used. The only difference between the two requests is the last question. The second request can reuse the content of the first 4 rounds of dialogue from the first request, which will count as a "cache hit."

Checking Cache Hit Status
In the response from the DeepSeek API, we have added two fields in the usage section to reflect the cache hit status of the request:

prompt_cache_hit_tokens: The number of tokens in the input of this request that resulted in a cache hit (0.1 yuan per million tokens).

prompt_cache_miss_tokens: The number of tokens in the input of this request that did not result in a cache hit (1 yuan per million tokens).

Hard Disk Cache and Output Randomness
The hard disk cache only matches the prefix part of the user's input. The output is still generated through computation and inference, and it is influenced by parameters such as temperature, introducing randomness.

Additional Notes
The cache system uses 64 tokens as a storage unit; content less than 64 tokens will not be cached.

The cache system works on a "best-effort" basis and does not guarantee a 100% cache hit rate.

Cache construction takes seconds. Once the cache is no longer in use, it will be automatically cleared, usually within a few hours to a few days.

Create Chat Completion
POST
https://api.deepseek.com/chat/completions
Creates a model response for the given chat conversation.

Request
application/json
Body

required

messages

object[]

required

model
string
required
Possible values: [deepseek-chat, deepseek-reasoner]

ID of the model to use. You can use deepseek-chat.

frequency_penalty
number
nullable
Possible values: >= -2 and <= 2

Default value: 0

Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.

max_tokens
integer
nullable
Possible values: > 1

Integer between 1 and 8192. The maximum number of tokens that can be generated in the chat completion.

The total length of input tokens and generated tokens is limited by the model's context length.

If max_tokens is not specified, the default value 4096 is used.

presence_penalty
number
nullable
Possible values: >= -2 and <= 2

Default value: 0

Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.

response_format

object

nullable

stop

object

nullable

stream
boolean
nullable
If set, partial message deltas will be sent. Tokens will be sent as data-only server-sent events (SSE) as they become available, with the stream terminated by a data: [DONE] message.

stream_options

object

nullable

temperature
number
nullable
Possible values: <= 2

Default value: 1

What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.

We generally recommend altering this or top_p but not both.

top_p
number
nullable
Possible values: <= 1

Default value: 1

An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

We generally recommend altering this or temperature but not both.

tools

object[]

nullable

tool_choice

object

nullable

logprobs
boolean
nullable
Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned in the content of message.

top_logprobs
integer
nullable
Possible values: <= 20

An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used.

Responses
200 (No streaming)
200 (Streaming)
OK, returns a chat completion object

application/json
Schema
Example (from schema)
Example
Schema

id
string
required
A unique identifier for the chat completion.

choices

object[]

required

created
integer
required
The Unix timestamp (in seconds) of when the chat completion was created.

model
string
required
The model used for the chat completion.

system_fingerprint
string
required
This fingerprint represents the backend configuration that the model runs with.

object
string
required
Possible values: [chat.completion]

The object type, which is always chat.completion.

usage

object

curl
python
go
nodejs
ruby
csharp
php
java
powershell
OpenAI SDK
import OpenAI from "openai";

# for backward compatibility, you can still use `https://api.deepseek.com/v1` as `baseURL`.
const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: '<your API key>'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "deepseek-chat",
  });

  console.log(completion.choices[0].message.content);
}

main();


AXIOS
NATIVE
const axios = require('axios');
let data = JSON.stringify({
  "messages": [
    {
      "content": "You are a helpful assistant",
      "role": "system"
    },
    {
      "content": "Hi",
      "role": "user"
    }
  ],
  "model": "deepseek-chat",
  "frequency_penalty": 0,
  "max_tokens": 2048,
  "presence_penalty": 0,
  "response_format": {
    "type": "text"
  },
  "stop": null,
  "stream": false,
  "stream_options": null,
  "temperature": 1,
  "top_p": 1,
  "tools": null,
  "tool_choice": "none",
  "logprobs": false,
  "top_logprobs": null
});

let config = {
  method: 'post',
maxBodyLength: Infinity,
  url: 'https://api.deepseek.com/chat/completions',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});



Request
Collapse all
Base URL
https://api.deepseek.com
Auth
Bearer Token
Bearer Token
Body
 required
{
  "messages": [
    {
      "content": "You are a helpful assistant",
      "role": "system"
    },
    {
      "content": "Hi",
      "role": "user"
    }
  ],
  "model": "deepseek-chat",
  "frequency_penalty": 0,
  "max_tokens": 2048,
  "presence_penalty": 0,
  "response_format": {
    "type": "text"
  },
  "stop": null,
  "stream": false,
  "stream_options": null,
  "temperature": 1,
  "top_p": 1,
  "tools": null,
  "tool_choice": "none",
  "logprobs": false,
  "top_logprobs": null
}
Send API Request
Response
Clear
Click the Send API Request button above and see the response here!

// Please install OpenAI SDK first: `npm install openai`

import OpenAI from "openai";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: '<DeepSeek API Key>'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "deepseek-chat",
  });

  console.log(completion.choices[0].message.content);
}

main();

Models & Pricing
The prices listed below are in unites of per 1M tokens. A token, the smallest unit of text that the model recognizes, can be a word, a number, or even a punctuation mark. We will bill based on the total number of input and output tokens by the model.

Pricing Details
MODEL(1)	deepseek-chat	deepseek-reasoner
CONTEXT LENGTH	64K	64K
MAX COT TOKENS(2)	-	32K
MAX OUTPUT TOKENS(3)	8K	8K
STANDARD PRICE
（UTC 00:30-16:30）	1M TOKENS INPUT (CACHE HIT)(4)	$0.07	$0.14
1M TOKENS INPUT (CACHE MISS)	$0.27	$0.55
1M TOKENS OUTPUT(5)	$1.10	$2.19
DISCOUNT PRICE(6)
（UTC 16:30-00:30）	1M TOKENS INPUT (CACHE HIT)	$0.035（50% OFF）	$0.035（75% OFF）
1M TOKENS INPUT (CACHE MISS)	$0.135（50% OFF）	$0.135（75% OFF）
1M TOKENS OUTPUT	$0.550（50% OFF）	$0.550（75% OFF）
(1) The deepseek-chat model points to DeepSeek-V3. The deepseek-reasoner model points to DeepSeek-R1.
(2) CoT (Chain of Thought) is the reasoning content deepseek-reasoner gives before output the final answer. For details, please refer to Reasoning Model。
(3) If max_tokens is not specified, the default maximum output length is 4K. Please adjust max_tokens to support longer outputs.
(4) Please check DeepSeek Context Caching for the details of Context Caching.
(5) The output token count of deepseek-reasoner includes all tokens from CoT and the final answer, and they are priced equally.
(6) DeepSeek API provides off-peak pricing discounts during 16:30-00:30 UTC each day. The completion timestamp of each request determines its pricing tier.
Deduction Rules
The expense = number of tokens × price. The corresponding fees will be directly deducted from your topped-up balance or granted balance, with a preference for using the granted balance first when both balances are available.

Product prices may vary and DeepSeek reserves the right to adjust them. We recommend topping up based on your actual usage and regularly checking this page for the most recent pricing information.

Lists Models
GET
https://api.deepseek.com/models
Lists the currently available models, and provides basic information about each one such as the owner and availability. Check Models & Pricing for our currently supported models.

Responses
200
OK, returns A list of models

application/json
Schema
Example (from schema)
Example
Schema

object
string
required
Possible values: [list]

data

Model[]

required

curl
python
go
nodejs
ruby
csharp
php
java
powershell
OpenAI SDK
import OpenAI from "openai";

# for backward compatibility, you can still use `https://api.deepseek.com/v1` as `baseURL`.
const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: '<your API key>'
});

async function main() {
  const models = await openai.models.list()
  for await (const model of models) {
    console.log(model);
  }
}

main();



AXIOS
NATIVE
const axios = require('axios');

let config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://api.deepseek.com/models',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});


Request
Collapse all
Base URL
https://api.deepseek.com
Auth
Bearer Token
Bearer Token
Send API Request
Response
Clear
Click the Send API Request button above and see the response here!