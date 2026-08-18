const TEST_DISTRICT_PATTERN = /test\s*district/i;

function districtDisplayName(district) {
  if (district == null) return "";
  if (typeof district === "string") return district;
  return (
    district.districtName ||
    district.name ||
    district.label ||
    district.fullName ||
    district.district_name ||
    ""
  );
}

export function isTestDistrict(district) {
  return TEST_DISTRICT_PATTERN.test(String(districtDisplayName(district)));
}

export function rejectTestDistricts(list = []) {
  return (list || []).filter((item) => !isTestDistrict(item));
}
