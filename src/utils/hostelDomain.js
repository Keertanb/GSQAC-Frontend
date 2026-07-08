const HOSTEL_MARKERS = [
  "school hostel",
  "શાળા છાત્રાલય",
  "छात्रावास",
  "विद्यालय छात्रावास",
];

function domainNameCandidates(domain) {
  return [
    domain?.domainNameEn,
    domain?.domainNameGu,
    domain?.domainNameHi,
    domain?.domainName,
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim())
    .map((value) => String(value).trim());
}

export function isHostelDomain(domain) {
  if (!domain) return false;

  const candidates = domainNameCandidates(domain);
  if (!candidates.length) return false;

  return candidates.some((name) => {
    const lower = name.toLowerCase();
    return HOSTEL_MARKERS.some(
      (marker) => name.includes(marker) || lower.includes(marker.toLowerCase()),
    );
  });
}

export function filterDomainsByHostelFacility(domains, hostelFacility) {
  if (!Array.isArray(domains)) return domains;

  if (hostelFacility === 1 || hostelFacility === "1" || hostelFacility === true) {
    return domains;
  }

  if (hostelFacility === 0 || hostelFacility === "0" || hostelFacility === false) {
    return domains.filter((domain) => !isHostelDomain(domain));
  }

  return domains;
}

export function formatHostelFacilityLabel(hostelFacility) {
  if (hostelFacility === null || hostelFacility === undefined || hostelFacility === "") {
    return "Not set";
  }
  return Number(hostelFacility) === 1 ? "Yes" : "No";
}
