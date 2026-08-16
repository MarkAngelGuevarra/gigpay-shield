import * as compactRuntime from "@midnight-ntwrk/compact-runtime";
const str = "A".repeat(32);
try {
  compactRuntime.CompactTypeOpaqueString.toValue(str);
  console.log("Success with 32 chars!");
} catch(e: any) {
  console.log("Error:", e.message);
}
