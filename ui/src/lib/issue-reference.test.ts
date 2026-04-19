import { describe, expect, it } from "vitest";
import { parseIssuePathIdFromPath, parseIssueReferenceFromHref } from "./issue-reference";

describe("issue-reference", () => {
  it("extracts issue ids from company-scoped issue paths", () => {
    expect(parseIssuePathIdFromPath("/PAP/issues/PAP-1271")).toBe("PAP-1271");
    expect(parseIssuePathIdFromPath("/issues/PAP-1179")).toBe("PAP-1179");
    expect(parseIssuePathIdFromPath("/issues/:id")).toBeNull();
  });

  it("extracts issue ids from full issue URLs", () => {
    expect(parseIssuePathIdFromPath("http://localhost:3100/PAP/issues/PAP-1179")).toBe("PAP-1179");
  });

  it("ignores placeholder issue paths", () => {
    expect(parseIssuePathIdFromPath("/issues/:id")).toBeNull();
    expect(parseIssuePathIdFromPath("http://localhost:3100/issues/:id")).toBeNull();
    expect(parseIssueReferenceFromHref("/issues/:id")).toBeNull();
  });

  it("normalizes bare identifiers, issue URLs, and issue scheme links into internal links", () => {
    expect(parseIssueReferenceFromHref("pap-1271")).toEqual({
      issuePathId: "PAP-1271",
      href: "/issues/PAP-1271",
    });
    expect(parseIssueReferenceFromHref("http://localhost:3100/PAP/issues/PAP-1179")).toEqual({
      issuePathId: "PAP-1179",
      href: "/issues/PAP-1179",
    });
    expect(parseIssueReferenceFromHref("issue://PAP-1310")).toEqual({
      issuePathId: "PAP-1310",
      href: "/issues/PAP-1310",
    });
    expect(parseIssueReferenceFromHref("issue://:PAP-1311")).toEqual({
      issuePathId: "PAP-1311",
      href: "/issues/PAP-1311",
    });
  });

  it("normalizes exact inline-code-like issue identifiers", () => {
    expect(parseIssueReferenceFromHref("PAP-1271")).toEqual({
      issuePathId: "PAP-1271",
      href: "/issues/PAP-1271",
    });
  });

  it("ignores literal route placeholder paths", () => {
    expect(parseIssueReferenceFromHref("/issues/:id")).toBeNull();
    expect(parseIssueReferenceFromHref("http://localhost:3100/api/issues/:id")).toBeNull();
  });

  it("ignores template/docs placeholders that would otherwise trigger 404s", () => {
    expect(parseIssuePathIdFromPath("/api/issues/{issueId}")).toBeNull();
    expect(parseIssuePathIdFromPath("/issues/<issue-identifier>")).toBeNull();
    expect(parseIssueReferenceFromHref("/api/issues/{issueId}")).toBeNull();
    expect(parseIssueReferenceFromHref("/issues/<issue-identifier>")).toBeNull();
    expect(parseIssueReferenceFromHref("issue://<issue-identifier>")).toBeNull();
    expect(parseIssueReferenceFromHref("issue://{issueId}")).toBeNull();
  });

  it("rejects trailing punctuation captured by segment-based parsing", () => {
    expect(parseIssuePathIdFromPath("/issues/PAP-224)")).toBeNull();
    expect(parseIssueReferenceFromHref("/issues/PAP-224)")).toBeNull();
    expect(parseIssueReferenceFromHref("issue://PAP-224)")).toBeNull();
  });
});
