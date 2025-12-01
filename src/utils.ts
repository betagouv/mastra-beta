import assert from "assert";

type Filter = { type: string; value: string | boolean };

function getFiltersToQueryParam(filters: Filter[]) {
  // Always append the active_only filter
  const allFilters = [...filters];
  if (!allFilters.find((f) => f.type === "active_only")) {
    allFilters.push({ type: "active_only", value: true });
  }
  // Encode each filter as a JSON string, then encodeURIComponent
  const encodedFilters = allFilters
    .map((f) =>
      JSON.stringify(f)
        .replace(/"/g, "%22")
        .replace(/,/g, "%252C")
        .replace(/ /g, "+")
    )
    .join(",");
  return encodedFilters;
}

export function getEspaceMembreCommunitySearchURL(filters: Filter[]) {
  const filtersToQueryParam = getFiltersToQueryParam(filters);
  const url = `https://espace-membre.incubateur.net/community?filters=${filtersToQueryParam}`;
  return url;
}

// todo: move to .spec file
const tests = [
  {
    args: [],
    expected:
      "https://espace-membre.incubateur.net/community?filters={%22type%22:%22active_only%22%252C%22value%22:true}",
  },
  {
    args: [{ type: "some", value: "thing" }],
    expected:
      "https://espace-membre.incubateur.net/community?filters={%22type%22:%22some%22%252C%22value%22:%22thing%22},{%22type%22:%22active_only%22%252C%22value%22:true}",
  },
  {
    args: [{ type: "some", value: "other thing" }],
    expected:
      "https://espace-membre.incubateur.net/community?filters={%22type%22:%22some%22%252C%22value%22:%22other+thing%22},{%22type%22:%22active_only%22%252C%22value%22:true}",
  },
];
tests.forEach((test) => {
  const res = getEspaceMembreCommunitySearchURL(test.args);
  assert(res === test.expected, `Expect ${res} to equal ${test.expected}`);
});
