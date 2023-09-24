import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as CommunityService from './community.service';
import ObjectID from "bson-objectid";
import slugify from 'slugify';
import { APIError } from '@/lib/errors';

// mock generate object id
// jest.spyOn(ObjectId, 'generate').mockImplementation(() => {
//   return Buffer.from('62a23958e5a9e9b88f853a67', 'hex');
// });

jest.mock("@/lib/prisma/client");
const generateInviteCode = jest.fn().mockReturnValue('jT83c');

test("should get all communities of a user", async () => {
  const userId = "123412341234"
  const expectedCommunities = [
    {
      id: "1",
      name: "testcommunity",
      slug: "testcommunity",
      createdBy: userId,
      memberIds: [userId],
      currentlyWatching: null,
      inviteCode: generateInviteCode(5),
      description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  prismaMock.community.findMany.mockResolvedValue(expectedCommunities)
  await expect(CommunityService.getCommunities(userId)).resolves.toStrictEqual(expectedCommunities);
});

describe("CommunityService.createCommunity", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should create a new community if it doesn't already exist", async () => {
    const userId = ObjectID();
    const date = new Date();
    const expected = {
      id: ObjectID(),
      name: "test",
      description: "Test community",
      slug: slugify("test", { lower: true }),
      inviteCode: generateInviteCode(5),
      currentlyWatching: null,
      createdAt: date,
      updatedAt: date
    };

    prismaMock.community.upsert.mockResolvedValue({
      ...expected,
      createdBy: userId.toString(),
      memberIds: [userId.toString()],
      createdAt: date,
      updatedAt: date
    });

    const actual = await CommunityService.createCommunity(
      userId.toString(),
      expected.name,
      expected.description
    );


    expect(generateInviteCode).toHaveBeenCalled();
    expect(actual).toMatchObject(expected);
  });

  test("should not create a new community with the same name", async () => {
    const userId = ObjectID();
    const date = new Date();
    const expected = {
      id: ObjectID(),
      name: "test",
      description: "Test community",
      slug: slugify("test", { lower: true }),
      inviteCode: generateInviteCode(5),
      currentlyWatching: null,
      createdAt: date,
      updatedAt: date
    };


    prismaMock.community.upsert.mockResolvedValue({
      ...expected,
      createdBy: userId.toString(),
      memberIds: [userId.toString()],
      createdAt: date,
      updatedAt: date
    });

    prismaMock.community.upsert.mockResolvedValue({
      ...expected,
      createdBy: userId.toString(),
      memberIds: [userId.toString()],
      createdAt: date,
      updatedAt: date
    });

    const orgCommunity = await CommunityService.createCommunity(
      userId.toString(),
      expected.name,
      expected.description
    );

    const duplicateCommunity = await CommunityService.createCommunity(
      userId.toString(),
      expected.name,
      expected.description
    );

    // if a new community was not created, then the results would have the same ids
    expect(duplicateCommunity.id).toEqual(orgCommunity.id);
    expect(duplicateCommunity).toMatchObject(orgCommunity);
  });

  test.todo("should re-generate a new invite code if it already exists")
});

describe("CommunityService.addMemberToCommunity", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should add user to community", async () => {
    const userId = ObjectID().toString();
    const userIdToJoin = ObjectID().toString();
    const inviteCode = generateInviteCode(5);
    const date = new Date();
    const community = {
      id: ObjectID().toString(),
      name: "test",
      description: "Test community",
      slug: slugify("test", { lower: true }),
      inviteCode,
      currentlyWatching: null,
      createdAt: date,
      updatedAt: date,
      memberIds: [userId],
      createdBy: userId
    };

    prismaMock.$transaction.mockImplementationOnce(callback => callback(prismaMock));
    prismaMock.community.findUnique.mockResolvedValueOnce(community);
    prismaMock.community.update.mockResolvedValueOnce({
      ...community,
      memberIds: [...community.memberIds, userIdToJoin]
    });

    const actual = await CommunityService.addUserToCommunity(inviteCode, userIdToJoin);
    console.log(actual)

    expect(actual.memberIds).toContain(userIdToJoin);
  });

  test.todo("should throw an error if user is already a member");
  test.todo("should throw an error with a invalid invite code")
})
