import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as Util from './util';
import ObjectID from 'bson-objectid';
import slugify from 'slugify';
import { APIError, UnauthorizedError } from '@/lib/errors';

jest.mock("@/lib/prisma/client");

describe("Util.getQueueCount", () => {
  test.todo("should return a queue count for a single community");  
});

describe("Util.parseCommunityIdAndSlugFromQuery", () => {
  test.todo("should return communityId as null if it's not a valid object id");  
  test.todo("should return slug as null if communityId is a valid object id");  
  test.todo("should throw an error if communityId querry does not exist");  
});

describe("Util.parseMediaIdFromQuery", () => {
  test.todo("should return a string if media id exists in the query");  
  test.todo("should return a null if media id DOES NOT exist in the query");  
});
