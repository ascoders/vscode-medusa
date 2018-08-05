import axios from "axios";

interface ILocale {
  resourceKey: string;
  resourceValue: string;
}

export async function searchLocales(
  appName: string,
  searchKey: string,
  value: string
): Promise<ILocale[]> {
  // Display a message box to the user
  const medusaRes = await axios.get(
    `https://mcms-portal.alibaba-inc.com/openapi/search?appName=${appName}&${searchKey}=${encodeURIComponent(
      value
    )}`
  );

  const result = medusaRes.data;

  if (result.success) {
    return result.data.list;
  } else {
    return [];
  }
}
