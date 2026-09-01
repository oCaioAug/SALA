import { getSafeCallbackPath } from "@/lib/auth/callback-path";

describe("getSafeCallbackPath", () => {
  it("returns null for empty values", () => {
    expect(getSafeCallbackPath(null)).toBeNull();
    expect(getSafeCallbackPath(undefined)).toBeNull();
    expect(getSafeCallbackPath("")).toBeNull();
  });

  it("accepts safe relative paths", () => {
    expect(getSafeCallbackPath("/organizations")).toBe("/organizations");
    expect(getSafeCallbackPath("/invite/token?x=1")).toBe("/invite/token?x=1");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(getSafeCallbackPath("//evil.example")).toBeNull();
    expect(getSafeCallbackPath("https://evil.example")).toBeNull();
    expect(getSafeCallbackPath("http://evil.example/path")).toBeNull();
  });
});
