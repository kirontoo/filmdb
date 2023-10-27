import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as MediaService from './media.service';
import ObjectID from "bson-objectid";
import slugify from 'slugify';
import { APIError, UnauthorizedError } from '@/lib/errors';

jest.mock("@/lib/prisma/client");


describe("MediaService.createMediaAndAddToCommunity", () => {
  test.todo("should create new media if not already in a community list");
  test.todo("should only add a new media if user is member of community");
  test.todo("should only allow the community owner can add to watched list");
  test.todo("the new queue number should match current queued count + 1");
});

describe("MediaService.updateMediaData", () => {
  test.todo("should only update media if user is a member of community");
  test.todo("should only allow the community owner can add to watched list");
  test.todo("should add a watchedAt date if moving media to the watched list");
  test.todo("should update queue number after adding to queued list");
  test.todo("the new queue number should match current queued count + 1");
});
