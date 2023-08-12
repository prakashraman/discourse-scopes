import { readFileSync, mkdirSync } from 'fs';
import { uniq } from 'lodash';
import moment from 'moment';

const INPUT_FILE_PATH = './data/conversations.txt';
const OUTPUT_BASE_DIR = './output';

export const readContents = () => {
  const response = readFileSync(INPUT_FILE_PATH, 'utf-8');
  const lines = response.split('\n').filter((l) => {
    return l.trim() != '';
  });
  return uniq(lines);
};

export const createOutputDir = () => {
  const name = moment().format('YYYYMMDD_HHmmss');
  const full = OUTPUT_BASE_DIR + '/' + name;
  console.log('creating output directory:', full);
  mkdirSync(full);
  return full;
};
