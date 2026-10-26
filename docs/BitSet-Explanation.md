## Level 0: The five-year-old version

Picture a classroom with **5,000 crayons**, each with a number on it (0, 1, 2 … 4,999). Each crayon is a **SKU**.

Every store (door) wants to know which crayons it's allowed to have. You could write each store its own list of crayon names, but with thousands of stores that's mountains of paper.

Instead you make **cards**. Each card has 5,000 tiny boxes, one per crayon:

- A **filled** box means "yes, allowed".
- An **empty** box means "no".

Then:

- **One card per tier.** The Gold card has boxes filled for every crayon in Gold's tier rules.
- **One card per product line.** The "FRAGRANCE" card has boxes filled for every crayon whose Axis is exactly "FRAGRANCE".
- **One "still sold" card.** Boxes are filled for every active crayon.

To find a store's crayons, stack its tier card, its product-line card and the still-sold card, and hold them up to the light. **Only boxes filled on every card are allowed.** That's the whole engine.

Stores with the same tier and product line get the **same answer**, so you only make that stacked card once and share it.

If a particular store has a special deal ("add crayon #42", "remove crayon #7"), you stick a **sticky note** on that store. You don't redraw the card; you just read the sticky notes after the card. A sticky note on the store beats one on the retailer it belongs to (door-level beats retailer-level).

That's a bitset. The rest of this explains how the computer does it so cheaply.

## Level 1: The words you need

| Term                | Meaning                                     | In this app                                    |
| ------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Bit**             | A single 0 or 1                             | One box on the card: is SKU #i in or out?      |
| **Bitset / bitmap** | A row of bits, one per item                 | One card: a yes/no for every SKU               |
| **Universe**        | All the items the bits can stand for        | All loaded SKUs (S of them)                    |
| **Index**           | An item's position (0 … S−1)                | SKU GUID mapped to a small number at load time |
| **Word**            | A group of bits the CPU handles in one step | 32 bits in a `Uint32Array` slot                |
| **Density**         | Share of bits that are 1                    | How much of the SKU catalogue a door carries   |
| **Popcount**        | Counting the 1s                             | "How many SKUs does this door get?"            |

## Level 2: How the computer stores the card

### Step 1: Give every SKU a number

Dataverse identifies SKUs by GUIDs such as `3f2a…-…`, which are long text. When the app loads SKUs, it numbers them in order:

```ts
// built once per load; never saved anywhere
const skuIndexById = new Map<string, number>(); // GUID -> 0..S-1
const skuIdByIndex: string[] = []; // 0..S-1 -> GUID
```

From then on the engine works with small numbers, not text. The numbers are only valid for the current session; they must never be saved, because the next load can number SKUs differently.

### Step 2: Pack 32 boxes into each slot

A `Uint32Array` is a fixed-length list of 32-bit numbers. Each slot holds 32 yes/no boxes.

```text
SKU index:  0  1  2  3 ... 31 | 32 33 ... 63 | 64 ...
Slot:       ------ slot 0 --- | -- slot 1 -- | slot 2 ...
```

To find SKU #i:

- **Which slot?** `i >>> 5` (the same as dividing by 32 and rounding down)
- **Which bit in that slot?** `i & 31` (the remainder after dividing by 32)

So SKU #70 is in slot 2 (70 ÷ 32 = 2), at bit 6 (70 − 64 = 6).

### Step 3: Size it

5,000 SKUs need 5,000 ÷ 32 = 157 slots (rounded up). At 4 bytes per slot that's **628 bytes per card**, less than a short text message.

## Level 3: The five basic operations

```ts
const wordsFor = (n: number) => Math.ceil(n / 32);
const create = (n: number) => new Uint32Array(wordsFor(n));

function set(b: Uint32Array, i: number) {
  b[i >>> 5] |= 1 << (i & 31);
} // fill box
function clear(b: Uint32Array, i: number) {
  b[i >>> 5] &= ~(1 << (i & 31));
} // empty box
function has(b: Uint32Array, i: number) {
  return (b[i >>> 5] & (1 << (i & 31))) !== 0;
}

function and(a: Uint32Array, b: Uint32Array) {
  // in both cards
  const out = new Uint32Array(a.length);
  for (let w = 0; w < a.length; w++) out[w] = a[w] & b[w];
  return out;
}
function or(a: Uint32Array, b: Uint32Array) {
  // in either card
  const out = new Uint32Array(a.length);
  for (let w = 0; w < a.length; w++) out[w] = a[w] | b[w];
  return out;
}
```

**Why it's fast:** each `a[w] & b[w]` compares **32 SKUs in one CPU step**. Combining two 5,000-SKU cards takes 157 steps, not 5,000.

### Counting (popcount)

"How many boxes are filled?" A standard trick counts the 1s in a 32-bit number without looping over each bit:

```ts
function popcount32(x: number) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}
const count = (b: Uint32Array) => b.reduce((n, w) => n + popcount32(w), 0);
```

### Listing the filled boxes (for a grid page)

This skips empty slots entirely and jumps straight to each filled bit:

```ts
function* eachIndex(b: Uint32Array) {
  for (let w = 0; w < b.length; w++) {
    let word = b[w];
    while (word !== 0) {
      const lowest = word & -word; // isolate the lowest filled bit
      yield (w << 5) + (31 - Math.clz32(lowest));
      word ^= lowest; // empty it and continue
    }
  }
}
```

## Level 4: Your engine rules as bitsets

Your engine's main rule maps directly onto AND.

### The building blocks (built once per data load)

| Card                 | How it's built                                                              | How many                    |
| -------------------- | --------------------------------------------------------------------------- | --------------------------- |
| `tierBits[tier]`     | For each **enabled** tier rule, fill the SKU's box                          | One per tier (T)            |
| `axisBits[axisText]` | Group SKUs by their **exact** `cr380_axis` text and fill each group's boxes | One per distinct Axis value |
| `activeBits`         | Fill the box of every SKU where `cr380_isactive` is true                    | 1                           |

### The base assortment for a (Tier, Product Line) pair

```ts
base(tier, productLine) = tierBits[tier] AND axisBits[productLine] AND activeBits
```

- **Exact text match comes for free.** `axisBits` is a `Map<string, Uint32Array>`, and map lookups compare text exactly. A door whose Product Line is `"Fragrance "` (trailing space) or `"fragrance"` finds no card, so its result is empty. That's precisely the near-miss behaviour Principle XIII asks you to test.
- **A missing tier** means there's no `tierBits` card, so the result is empty and the reason is `NO_TIER`.
- **If a door ever has several Product Lines**, combine them with OR first: `tier AND (axisA OR axisB) AND active`.
- **Cache each result** in a `Map` keyed by `"tierId|productLine"`. It's calculated once and shared by every door with that pair.

### Tiny worked example

10 SKUs, tier **Gold**, door Product Line **"FRAGRANCE"**:

| SKU #                       | 0     | 1   | 2   | 3     | 4   | 5   | 6     | 7   | 8   | 9     |
| --------------------------- | ----- | --- | --- | ----- | --- | --- | ----- | --- | --- | ----- |
| Gold tier rule (enabled)    | 1     | 1   | 0   | 1     | 1   | 0   | 1     | 0   | 1   | 1     |
| Axis is exactly "FRAGRANCE" | 1     | 0   | 0   | 1     | 1   | 1   | 1     | 0   | 0   | 1     |
| SKU is active               | 1     | 1   | 1   | 1     | 0   | 1   | 1     | 1   | 1   | 1     |
| **Base = AND of all three** | **1** | 0   | 0   | **1** | 0   | 0   | **1** | 0   | 0   | **1** |

Base for Gold + FRAGRANCE = SKUs {0, 3, 6, 9}, so the count is 4.

### Sticky notes (exceptions)

Exceptions are **not** put into the bitset. They stay as small lookup tables keyed by SKU number:

```ts
doorExc: Map<doorId, Map<skuIdx, 'add' | 'remove'>>;
retailerExc: Map<distributorCode, Map<skuIdx, 'add' | 'remove'>>;
```

**Is SKU s in door d?**

```text
1. Door sticky note for (d, s)?            -> it decides     (door wins)
2. Otherwise retailer sticky note (r_d, s)? -> it decides
3. Otherwise                               -> read base(tier_d, PL_d) at s
```

**Counting a door without building its list:** start from the base count, then adjust only for the SKUs that have a sticky note.

```ts
let total = baseCount; // popcount, cached per pair
for (const s of union(doorKeys, retailerKeys)) {
  const action = doorExc.get(s) ?? retailerExc.get(s);
  const before = has(base, s) ? 1 : 0;
  const after = action === 'add' ? 1 : 0;
  total += after - before; // "add" to a SKU already in base changes nothing
}
```

Continuing the example: a door adds SKU 2 (+1) and removes SKU 6 (−1), so its count is still 4, but the SKUs are {0, 2, 3, 9}. Its retailer also removes SKU 9 (−1), giving 3.

### "Why is this SKU in or out?" (calculated on request, never stored)

`explain(door, sku)` checks things in a fixed order and returns the first reason that applies:

| Check                  | Reason code                                                     |
| ---------------------- | --------------------------------------------------------------- |
| Door sticky note       | `ADDED_BY_DOOR_EXCEPTION` / `REMOVED_BY_DOOR_EXCEPTION`         |
| Retailer sticky note   | `ADDED_BY_RETAILER_EXCEPTION` / `REMOVED_BY_RETAILER_EXCEPTION` |
| No tier                | `NO_TIER`                                                       |
| `tierBits` box empty   | `NOT_IN_TIER_RULES`                                             |
| `axisBits` box empty   | `AXIS_MISMATCH`                                                 |
| `activeBits` box empty | `SKU_INACTIVE`                                                  |
| Otherwise              | `IN_BASE_ASSORTMENT`                                            |

Each check is a single bit test or map lookup, so this is effectively instant. Agree this order in the spec; it's a business decision, not a technical one.

## Level 5: Why it fits your volumes

Example: 3,000 doors, 5,000 SKUs, 6 tiers, 12 product lines, 20,000 exceptions.

| Item                   | Memory             |
| ---------------------- | ------------------ |
| 6 tier cards           | 6 × 628 B ≈ 3.7 KB |
| ~12 axis cards         | ≈ 7.5 KB           |
| 1 active card          | 628 B              |
| 72 cached base cards   | ≈ 45 KB            |
| Exception maps         | ≈ under 1 MB       |
| **Total engine state** | **about 1 MB**     |

Holding the same 4.5M door × SKU results as objects would take about 450 MB.

| Task                     | Work involved                                    |
| ------------------------ | ------------------------------------------------ |
| Build all base cards     | 72 × 157 slots × 2 ANDs ≈ 22,600 steps           |
| One door's count         | 1 lookup + its sticky notes                      |
| Totals for all doors     | Roughly one step per door plus one per exception |
| One grid page of 50 SKUs | Jump through filled bits until 50 are found      |

## Level 6: When bitsets are the wrong tool

| Situation                                                                  | Better choice                                                                                                                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Very **sparse** data (e.g. a door's exceptions touch 20 of 5,000 SKUs)     | A `Map` or sorted `Int32Array` of SKU numbers; a bitset would waste 628 B to store 20 facts                                                                                                             |
| A huge universe that's mostly empty (millions of possible items, few used) | Compressed bitmaps such as Roaring (blocks of 65,536 stored as an array or bitset, whichever is smaller). The `roaring` npm package is Apache-2.0, which the constitution's MIT-only rule doesn't allow |
| A small, dense universe (your SKU catalogue)                               | **Plain `Uint32Array` bitset**, which is your case                                                                                                                                                      |

A rough rule: a bitset beats a list of numbers once more than about 1 in 32 boxes is filled (each listed number costs 4 bytes, the same as 32 bits).

## Level 7: Pitfalls

1. **Signed numbers.** In JavaScript, `1 << 31` is **negative**. Storing into a `Uint32Array` fixes it, but when comparing or reading results, use `!== 0` or `>>> 0` rather than `> 0`.
2. **Leftover boxes at the end.** 5,000 SKUs need 157 slots, which hold 5,024 bits. The last 24 must stay **0**. If you ever compute "NOT" (everything not in the card), zero them afterwards or counts will be wrong.
3. **Numbering only lives for one load.** Rebuild the GUID → number mapping every load, and never save the numbers or the bitsets.
4. **Don't change shared cards.** Base cards are shared by many doors. Treat them as read-only; copy before modifying, or React will miss changes and other doors will be corrupted.
5. **Rebuild only what changed.** A tier rule edit rebuilds that tier's card and its base cards. A SKU going inactive changes the active card and every base card. A new SKU means renumbering and a full rebuild.
6. **Exact means exact.** The constitution says no trimming and case-sensitive matching. Don't "helpfully" clean up Axis or Product Line text in the adapter.
7. **Web Workers.** `Uint32Array` buffers can be handed to a Web Worker without copying, which matters only at the Large volume tier.

## Level 8: How to test it (100% coverage)

1. **Reference engine:** a deliberately simple loop over every door × SKU that applies the rules literally. Test-only.
2. **Equivalence tests:** generate random catalogues, tiers, product lines (including near-miss text) and exceptions, and check that the bitset engine agrees with the reference on **every** door × SKU and every reason code. `fast-check` (MIT) does this.
3. **Low-level unit tests:** `set`, `clear`, `has`, `and`, `or`, `popcount32`, `eachIndex` at the edges: index 0, 31, 32, the last index, empty cards, full cards, and the leftover bits at the end.
4. **Benchmarks:** `vitest bench` with synthetic Small, Medium and Large datasets, checked against the 200 ms per-door target.

## Self-check: you're the expert if you can answer these

1. Why do doors with the same Tier and Product Line share one base card?
2. Where in the bitset is SKU #4,100 stored? (Slot 128, bit 4.)
3. Why are exceptions kept outside the bitset?
4. A door adds a SKU that's already in its base. Does its count change? (No.)
5. Why does `"Fragrance "` produce an empty assortment, and which test proves it?
6. What breaks if you save SKU numbers or bitsets between sessions?
7. When would you use a sorted list instead of a bitset?
8. Why can't you use the `roaring` package in this repo?
