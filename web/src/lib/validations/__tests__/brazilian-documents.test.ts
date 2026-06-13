import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  maskCnpj,
  maskCpf,
  maskPhone,
  stripDocument,
} from "@/lib/validations/brazilian-documents";

describe("brazilian-documents", () => {
  describe("isValidCpf", () => {
    it("validates a known valid CPF", () => {
      expect(isValidCpf("529.982.247-25")).toBe(true);
    });

    it("rejects invalid CPF", () => {
      expect(isValidCpf("111.111.111-11")).toBe(false);
      expect(isValidCpf("123")).toBe(false);
    });
  });

  describe("isValidCnpj", () => {
    it("validates a known valid CNPJ", () => {
      expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
    });

    it("rejects invalid CNPJ", () => {
      expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
    });
  });

  describe("formatters", () => {
    it("formats CPF and CNPJ", () => {
      expect(formatCpf("52998224725")).toBe("529.982.247-25");
      expect(formatCnpj("11444777000161")).toBe("11.444.777/0001-61");
    });

    it("formats CPF and CNPJ progressively while typing", () => {
      expect(maskCpf("529")).toBe("529");
      expect(maskCpf("529982")).toBe("529.982");
      expect(maskCnpj("11444")).toBe("11.444");
      expect(maskCnpj("114447770001")).toBe("11.444.777/0001");
    });

    it("formats phone progressively while typing", () => {
      expect(maskPhone("11")).toBe("11");
      expect(maskPhone("119999")).toBe("(11) 9999");
      expect(maskPhone("11999999999")).toBe("(11) 9 9999-9999");
      expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("strips non-digits", () => {
      expect(stripDocument("529.982.247-25")).toBe("52998224725");
    });
  });
});
