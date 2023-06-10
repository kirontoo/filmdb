import { MediaWithRatingAndComments } from "@/context/MediaProvider";
import { Media } from "@prisma/client";

export function generateInviteCode(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export async function updateMedia(media: Media): Promise<{
  res: Response;
  data: { status: string; data: { media: MediaWithRatingAndComments } };
}> {
  const res = await fetch(
    `/api/community/${media.communityId}/media/${media.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watched: media.watched,
      }),
    }
  );

  const data = await res.json();
  return { res, data };
}

export function sortByDate<T extends { startTime: Date }>(
  list: T[],
  direction: "ascending" | "descending"
): T[] {
  return list.sort((a: T, b: T): number => {
    let dateA =
      direction === "ascending" ? a.startTime.getTime() : b.startTime.getTime();
    let dateB =
      direction === "ascending" ? b.startTime.getTime() : a.startTime.getTime();
    return dateA - dateB;
  });
}

export function filterByKeyValue<T, K extends keyof T>(
  list: T[],
  key: K,
  value: any
): T[] {
  return list.filter((i: T) => i[key] == value);
}

export function filterOutByKeyValue<T, K extends keyof T>(
  list: T[],
  key: K,
  value: any
): T[] {
  return list.filter((i: T) => i[key] != value);
}

export interface Sorter<T> {
  property: Extract<keyof T, string | number | Date>;
  isDescending: boolean;
}

// comparator function for any property within type T
// works for: strings, numbers, and Dates (and is typed to accept only properties which are those types)
// could be extended for other types but would need some custom comparison function here
export function genericSort<T>(objectA: T, objectB: T, sorter: Sorter<T>) {
  const result = () => {
    if (objectA[sorter.property] > objectB[sorter.property]) {
      return 1;
    } else if (objectA[sorter.property] < objectB[sorter.property]) {
      return -1;
    } else {
      return 0;
    }
  };
  return sorter.isDescending ? result() * -1 : result();
}

export interface Filter<T> {
  property: keyof T;
  isTruthyPicked: boolean;
  value?: Extract<T[keyof T], string | boolean | number>;
}

// filter n properties for truthy or falsy values on type T (no effect if no filter selected)
// will also filter n properties for a specific value if any
export function genericFilter<T>(object: T, filters: Array<Filter<T>>) {
  // no filters; no effect - return true
  if (filters.length === 0) {
    return true;
  }

  return filters.every((filter) => {
    if (filter.value !== null) {
      // the value you want to filter against if any
      return object[filter.property] == filter.value;
    }
    return filter.isTruthyPicked
      ? object[filter.property]
      : !object[filter.property];
  });
}
// case insensitive search of n-number properties of type T
// returns true if at least one of the property values includes the query value
export function genericSearch<T>(
  object: T,
  properties: Array<keyof T>,
  query: string
): boolean {
  if (query === "") {
    return true;
  }
  return properties.some((property) => {
    const value = object[property];
    if (typeof value === "string" || typeof value === "number") {
      return value.toString().toLowerCase().includes(query.toLowerCase());
    }
    return false;
  });
}

// @param duration number of minutes
// @return string of hours and minutes
export function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if(hours == 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
