import { describe, expect, it } from "vitest";
import { isAllowedProtocol, isBlockedAddress } from "./net-guard";

describe("isBlockedAddress — IPv4", () => {
	it("blocks loopback", () => {
		expect(isBlockedAddress("127.0.0.1")).toBe(true);
		expect(isBlockedAddress("127.255.255.254")).toBe(true);
	});

	it("blocks the cloud metadata endpoint", () => {
		expect(isBlockedAddress("169.254.169.254")).toBe(true);
	});

	it("blocks the RFC1918 private ranges", () => {
		for (const ip of [
			"10.0.0.1",
			"172.16.0.1",
			"172.31.255.255",
			"192.168.1.1",
		]) {
			expect(isBlockedAddress(ip), ip).toBe(true);
		}
	});

	it("allows public addresses adjacent to private ones", () => {
		for (const ip of ["172.15.0.1", "172.32.0.1", "11.0.0.1", "192.169.0.1"]) {
			expect(isBlockedAddress(ip), ip).toBe(false);
		}
	});

	it("blocks CGNAT, multicast, reserved and broadcast", () => {
		for (const ip of [
			"100.64.0.1",
			"100.127.255.255",
			"224.0.0.1",
			"240.0.0.1",
			"255.255.255.255",
			"0.0.0.0",
		]) {
			expect(isBlockedAddress(ip), ip).toBe(true);
		}
	});

	it("allows ordinary public addresses", () => {
		for (const ip of [
			"8.8.8.8",
			"1.1.1.1",
			"93.184.216.34",
			"100.63.255.255",
		]) {
			expect(isBlockedAddress(ip), ip).toBe(false);
		}
	});

	it("fails closed on malformed input", () => {
		for (const ip of [
			"",
			"not-an-ip",
			"1.2.3",
			"1.2.3.4.5",
			"999.1.1.1",
			"1.2.3.-1",
		]) {
			expect(isBlockedAddress(ip), ip).toBe(true);
		}
	});
});

describe("isBlockedAddress — IPv6", () => {
	it("blocks loopback and unspecified", () => {
		expect(isBlockedAddress("::1")).toBe(true);
		expect(isBlockedAddress("::")).toBe(true);
	});

	it("blocks unique-local, link-local and multicast", () => {
		for (const ip of ["fc00::1", "fd12:3456::1", "fe80::1", "ff02::1"]) {
			expect(isBlockedAddress(ip), ip).toBe(true);
		}
	});

	it("sees through IPv4-mapped addresses", () => {
		expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true);
		expect(isBlockedAddress("::ffff:169.254.169.254")).toBe(true);
		expect(isBlockedAddress("::ffff:192.168.0.1")).toBe(true);
		expect(isBlockedAddress("::ffff:8.8.8.8")).toBe(false);
	});

	it("sees through the hex form of IPv4-mapped addresses", () => {
		// ::ffff:7f00:1 is 127.0.0.1 written in hex.
		expect(isBlockedAddress("::ffff:7f00:1")).toBe(true);
		// ::ffff:808:808 is 8.8.8.8.
		expect(isBlockedAddress("::ffff:808:808")).toBe(false);
	});

	it("sees through NAT64 translation addresses", () => {
		expect(isBlockedAddress("64:ff9b::127.0.0.1")).toBe(true);
		expect(isBlockedAddress("64:ff9b::8.8.8.8")).toBe(false);
	});

	it("ignores a zone id", () => {
		expect(isBlockedAddress("fe80::1%eth0")).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isBlockedAddress("FE80::1")).toBe(true);
		expect(isBlockedAddress("::FFFF:127.0.0.1")).toBe(true);
	});

	it("allows public IPv6", () => {
		expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false);
	});
});

describe("isAllowedProtocol", () => {
	it("allows http and https only", () => {
		expect(isAllowedProtocol(new URL("http://example.com"))).toBe(true);
		expect(isAllowedProtocol(new URL("https://example.com"))).toBe(true);
	});

	it("rejects everything else", () => {
		for (const u of [
			"file:///etc/passwd",
			"ftp://example.com",
			"data:text/html,x",
			"gopher://example.com",
		]) {
			expect(isAllowedProtocol(new URL(u)), u).toBe(false);
		}
	});
});
