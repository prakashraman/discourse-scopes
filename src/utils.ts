import { readFileSync, mkdirSync } from 'fs';
import { uniq, map } from 'lodash';
import moment from 'moment';
import { resolve } from 'path';

const INPUT_FILE_NAME = 'conversations.txt';

export const readContents = (basePath: string) => {
  const response = readFileSync(resolve(basePath, INPUT_FILE_NAME), 'utf-8');
  const lines = response.split('\n').filter((l) => {
    return l.trim() != '';
  });
  return uniq(lines);
};

export const createOutputDir = (base: string) => {
  const name = moment().format('YYYYMMDD_HHmmss');
  const full = resolve(base, `output_${name}`);
  console.log('creating output directory:', full);
  mkdirSync(full);
  return full;
};

export type Dataset = {
  messages: string[];
  messageMap: { [key: string]: string };
  prompt: string;
};

export const createDatasetFromMessages = (messages: string[]): Dataset => {
  const messageMap = messages.reduce((acc, m, i) => {
    return {
      ...acc,
      [String.fromCharCode(65 + i)]: m,
    };
  }, {});

  const input = map(messageMap, (value, key) => {
    return [`[ID: ${key}]`, value, '', ''].join('\n');
  });

  const prompt = [
    'give me at most 3 topics discussed for each of the sentences below. Let the output must only be in the format:',
    'A: topic 1, topic, 2',
    'B: topic 1, topic 2',
    'C: topic 1, topic 2',
    '',
    '',
    input,
  ].join('\n');

  return {
    prompt,
    messageMap,
    messages,
  };
};

export const getKeyAndTopicsFromText = (
  text: string,
): { key?: string; topics?: string[] } => {
  const regex = /^([A-Za-z])\s*:\s*(.*?)$/;
  const matches = text.match(regex);

  if (!matches) return { topics: [] };

  return {
    key: matches[1].trim(),
    topics: matches[2].split(',').map((t) => t.trim()),
  };
};

export const getArgs = () => {
  return process.argv.slice(2).reduce((acc, arg) => {
    const [k, v] = arg.split('=');
    return {
      ...acc,
      [k]: v,
    };
  }, {});
};
