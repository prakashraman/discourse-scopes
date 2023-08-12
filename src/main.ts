import {
  createOutputDir,
  readContents,
  getKeyAndTopicsFromText,
  Dataset,
  createDatasetFromMessages,
} from './utils';
import { chunk, uniq } from 'lodash';
import { writeFileSync } from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { resolve } from 'path';

const outputDir = createOutputDir();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CONFIGURATION = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const OPENAI = new OpenAIApi(CONFIGURATION);

const conversations = readContents();
const cleanedFiledPath = outputDir + '/' + 'conversations-cleaned.txt';
console.log('storing cleaned conversation at:', cleanedFiledPath);
writeFileSync(cleanedFiledPath, conversations.join('\n'));

const chunks = chunk(conversations, 5);
// const c = chunks[0];
// const promptInput = c
//   .map((l, index) => {
//     return [`[ID: ${String.fromCharCode(65 + index)}]`, l, '', ''].join('\n');
//   })
//   .join('\n');

// const prompt = [
//   'give me at most 3 topics discussed for each of the sentences below. Let the output be just the topics and nothing else. Let the format be YAML',
//   '',
//   '',
//   promptInput,
// ].join('\n');

var allTopics = [];
var bank: { [key: string]: string[] } = {};

const queryOpenAi = async (dataset: Dataset) => {
  try {
    const completion = await OPENAI.createCompletion({
      model: 'text-davinci-003',
      prompt: dataset.prompt,
      max_tokens: 300,
    });
    const content = completion.data.choices[0].text;
    console.log(content);
    content.split('\n').forEach((text) => {
      console.log({ text });
      const data = getKeyAndTopicsFromText(text);
      console.log({ data });
      const message = dataset.messageMap[data.key];
      data.topics.forEach((topic) => {
        if (!bank[topic]) bank[topic] = [];
        bank[topic].push(message);
      });
    });
  } catch (e) {
    console.log({ e });
    console.log(e.message);
  }
};

const writeAllTopics = () => {
  const allTopicsPath = resolve(outputDir, 'all-topics.txt');
  console.log('writing all topics to: ', allTopicsPath);
  console.log(allTopics);
  writeFileSync(allTopicsPath, uniq(allTopics).join('\n'));
};

(async () => {
  // for (let index = 0; index < chunks.length; index++) {
  for (let index = 0; index < 1; index++) {
    const c = chunks[0];
    const dataset = createDatasetFromMessages(c);
    await queryOpenAi(dataset);
  }

  writeAllTopics();
  console.log({ bank });
})();
