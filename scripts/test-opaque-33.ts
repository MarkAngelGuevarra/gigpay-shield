import * as compactRuntime from "@midnight-ntwrk/compact-runtime";
const str = "A".repeat(33);
try {
  compactRuntime.CompactTypeOpaqueString.toValue(str);
  console.log("Success with 33 chars!");
} catch(e: any) {
  console.log("Error:", e.message);
}
