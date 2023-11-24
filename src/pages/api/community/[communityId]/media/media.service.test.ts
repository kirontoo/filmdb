import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as MediaService from './media.service';
import ObjectID from "bson-objectid";
import slugify from 'slugify';
import { APIError, UnauthorizedError } from '@/lib/errors';
import { MediaType } from '@prisma/client';

jest.mock("@/lib/prisma/client");


const OwnerUserId = ObjectID().toString();
const MockDateObj = new Date();
const MemberUserId = ObjectID().toString();
const MockTMDBId = "38x18bv7ds"
const MockCommunityId = ObjectID.toString();

const MockCommunity = {
  id: MockCommunityId,
  name: "bob's burgers",
  description: "bob's burgers employee media library",
  slug: slugify("bob's burgers", { lower: true }),
  inviteCode: "S3bt8",
  currentlyWatching: null,
  createdAt: MockDateObj,
  updatedAt: MockDateObj,
  memberIds: [OwnerUserId],
  createdBy: OwnerUserId
};

const MockMedia = {
  id: ObjectID().toString(),
  title: "Nightmare Before Christmas",
  mediaType: "movie" as MediaType,
  tmdbId: MockTMDBId,
  imdbId: "12398745",
  posterPath: "",
  backdropPath: "",
  watched: false,
  createdAt: MockDateObj,
  updatedAt: MockDateObj,
  watchedAt: null,
  communityId: MockCommunityId,
  genres: [],
  rating: 0,
}

describe("MediaService.createMediaAndAddToCommunity", () => {
  test("should create new media if not already in a community list", async () => {
    prismaMock.$transaction.mockImplementationOnce(callback => callback(prismaMock));
    prismaMock.community.findUnique.mockResolvedValueOnce(MockCommunity);

    prismaMock.media.upsert.mockResolvedValueOnce({
      ...MockMedia,
      requestedById: OwnerUserId,
      queue: 1,
      scheduledAt: null,
    });

    prismaMock.media.aggregate.mockReturnValueOnce({
      // @ts-ignore
      _count: { _all: 0 }
    });

    const expected = await MediaService.createMediaAndAddToCommunity(MockCommunityId, OwnerUserId, { ...MockMedia })

    expect(expected.title).toEqual(MockMedia.title);
    expect(expected.tmdbId).toEqual(MockTMDBId);
  });

  test.todo("should only add a new media if user is member of community");
  test.todo("should only allow the community owner can add to watched list");
  test.todo("the new queue number should match current queued count + 1");
  test.todo("should throw an error if the community does not exist");
});

describe("MediaService.updateMediaData", () => {
  test.todo("should only update media if user is a member of community");
  test.todo("should only allow the community owner can add to watched list");
  test.todo("should add a watchedAt date if moving media to the watched list");
  test.todo("should update queue number after adding to queued list");
  test.todo("the new queue number should match current queued count + 1");
});
