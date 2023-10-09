import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as CommunityService from './community.service';
import ObjectID from "bson-objectid";
import slugify from 'slugify';
import { APIError, UnauthorizedError } from '@/lib/errors';

jest.mock("@/lib/prisma/client");
const generateInviteCode = jest.fn().mockReturnValue('jT83c');

// TODO generate a mock community as testing data

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
    const userId = ObjectID().toString();
    const date = new Date();
    const expected = {
      id: ObjectID().toString(),
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
    const userId = ObjectID().toString();
    const date = new Date();
    const expected = {
      id: ObjectID().toString(),
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
      createdBy: userId,
      memberIds: [userId],
      createdAt: date,
      updatedAt: date
    });

    prismaMock.community.upsert.mockResolvedValue({
      ...expected,
      createdBy: userId,
      memberIds: [userId],
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

    expect(actual.memberIds).toContain(userIdToJoin);
  });

  test("should throw an error if user is already a member", async () => {
    const userId = ObjectID().toString();
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

    await expect(CommunityService.addUserToCommunity(inviteCode, userId))
      .rejects
      .toThrow('user is already a member of this community');
  });

  test("should throw an error with a invalid invite code", async () => {
    const userId = ObjectID().toString();
    const inviteCode = generateInviteCode(5);

    prismaMock.$transaction.mockImplementationOnce(callback => callback(prismaMock));
    prismaMock.community.findUnique.mockResolvedValueOnce(null);

    await expect(CommunityService.addUserToCommunity(inviteCode, userId)).rejects.toThrow('invalid invite code')
  })
});

describe("CommunityService.removeUserFromCommunity", () => {
  test("should remove user from a community", async () => {
    const userIdA = ObjectID().toString();
    const userIdB = ObjectID().toString();
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
      memberIds: [userIdA],
      createdBy: userIdA
    };

    prismaMock.community.update.mockResolvedValueOnce(community);

    const expected = await CommunityService.removeUserFromCommunity(community.id, userIdB);

    expect(expected!.memberIds).not.toContain(userIdB);
  });
});

describe("CommunityService.updateCommunity", () => {
  test("should not update if user is not the owner", async () => {
    const userId = ObjectID().toString();
    const cId = ObjectID().toString();
    prismaMock.user.findFirstOrThrow.mockRejectedValue(new APIError("not authorized", UnauthorizedError));

    await expect(CommunityService.updateCommunity(cId, userId, {
      description: "new description"
    })).rejects.toThrow('not authorized');
  });

  test("should update only the community name", async () => {
    const userId = ObjectID().toString();
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

    const newName = "My test community";
    const newNameSlug = slugify("My test community", { lower: true });

    prismaMock.user.findFirstOrThrow.mockResolvedValueOnce({
      id: userId,
      email: "test@test.com",
      name: "testuser",
      createdAt: date,
      updatedAt: date,
      communityIds: [community.id],
      emailVerified: date,
      image: "image string"
    });

    prismaMock.community.update.mockResolvedValue({
      ...community,
      name: newName,
      slug: newNameSlug
    })

    const expected = await CommunityService.updateCommunity(
      community.id,
      userId,
      { name: newName }
    );

    expect(expected.name).not.toEqual(community.name);
    expect(expected.name).toEqual(newName);

    expect(expected.slug).not.toEqual(community.slug);
    expect(expected.slug).toEqual(newNameSlug);
  });

  test("should update only the community description", async () => {
     const userId = ObjectID().toString();
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

    const newDescription = "this is a updated description";

    prismaMock.user.findFirstOrThrow.mockResolvedValueOnce({
      id: userId,
      email: "test@test.com",
      name: "testuser",
      createdAt: date,
      updatedAt: date,
      communityIds: [community.id],
      emailVerified: date,
      image: "image string"
    });

    prismaMock.community.update.mockResolvedValue({
      ...community,
      description: newDescription,
    })

    const expected = await CommunityService.updateCommunity(
      community.id,
      userId,
      { description: newDescription }
    );

    expect(expected.description).not.toEqual(community.description);
    expect(expected.description).toEqual(newDescription);
  });
});
