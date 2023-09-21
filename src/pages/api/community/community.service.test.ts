import { prismaMock } from '@/lib/prisma/__mocks__/client';
import * as CommunityService from './community.service';
import { ObjectId } from "bson";
import slugify from 'slugify';


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
      inviteCode: '3cerfg',
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
    const userId = ObjectId.generate();
    const date = new Date();
    const expected = {
      id: ObjectId.generate().toString(),
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
    const userId = ObjectId.generate();
    const date = new Date();
    const expected = {
      id: ObjectId.generate().toString(),
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
