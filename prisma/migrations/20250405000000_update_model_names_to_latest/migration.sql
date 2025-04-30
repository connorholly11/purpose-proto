-- Update all system prompts using 'gpt-4o' to use 'chatgpt-4o-latest'
UPDATE "SystemPrompt"
SET "modelName" = 'chatgpt-4o-latest'
WHERE "modelName" = 'gpt-4o'; 