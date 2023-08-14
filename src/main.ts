import {
  createOutputDir,
  readContents,
  getKeyAndTopicsFromText,
  Dataset,
  createDatasetFromMessages,
  getArgs,
} from './utils';
import { chunk, uniq, map } from 'lodash';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { resolve } from 'path';
import slugify from 'slugify';

const args = getArgs();

if (!args['data'])
  throw new Error(
    '"data" parameter is missing. this parameter determines where the output will be stored',
  );

const DATA_DIR = args['data'];

const outputDir = createOutputDir(DATA_DIR);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CONFIGURATION = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const OPENAI = new OpenAIApi(CONFIGURATION);

const conversations = readContents(DATA_DIR);
const cleanedFiledPath = outputDir + '/' + '__conversations-cleaned.txt';
console.log('storing cleaned conversation at:', cleanedFiledPath);
console.log(`parsing through conversations: `, conversations.length);
writeFileSync(cleanedFiledPath, conversations.join('\n'));

const chunks = chunk(conversations, 10);

var allTopics = [];
var bank: { [key: string]: string[] } = {};

const queryOpenAi = async (dataset: Dataset) => {
  console.log('querying next set of conversations on openai');
  try {
    const completion = await OPENAI.createCompletion({
      model: 'text-davinci-003',
      prompt: dataset.prompt,
      max_tokens: 300,
    });
    // console.log({ dataset });
    const content = completion.data.choices[0].text;
    // console.log(completion.data.choices);
    // console.log(content);
    content.split('\n').forEach((text) => {
      // console.log({ text });
      const data = getKeyAndTopicsFromText(text);
      // console.log({ data });
      // console.log('text:', text);
      const message = dataset.messageMap[data.key];
      data.topics.forEach((topic) => {
        const slugTopic = slugify(topic, { lower: true, trim: true });
        if (!bank[slugTopic]) bank[slugTopic] = [];
        bank[slugTopic].push(message);
        allTopics.push(topic);
      });
    });
  } catch (e) {
    console.log({ e });
    console.log(e.message);
  }
};

const writeAllTopics = () => {
  const allTopicsPath = resolve(outputDir, '__all-topics.txt');
  console.log('writing all topics to: ', allTopicsPath);
  writeFileSync(allTopicsPath, uniq(allTopics).join('\n'));
};

const flushBank = () => {
  console.log('flushing bank and writing to all topic files');
  map(bank, (messages, topic) => {
    const topicPath = resolve(outputDir, `${topic}.txt`);
    appendFileSync(topicPath, ['\n', ...messages].join('\n'));
  });
  bank = {}; // empties the bank
};

(async () => {
  for (let index = 0; index < chunks.length; index++) {
    // for (let index = 0; index < 1; index++) {
    const c = chunks[index];
    const dataset = createDatasetFromMessages(c);
    await queryOpenAi(dataset);

    if (index % 3 == 0) flushBank();
  }
  flushBank();
  writeAllTopics();
  console.log('and... done.');
})();
