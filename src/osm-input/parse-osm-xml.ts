import { LatLngLiteral } from "leaflet";
import { isUndefined } from "../common/utils/type-helpers";

type TagSet = Record<string, string>;

export interface OsmNode {
  id: string;
  coord: LatLngLiteral;
  tags: TagSet;
}

interface OsmWay {
  id: string;
  nodeRefs: string[];
  tags: TagSet;
}

export function parseOsmXml(xmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");
  const nodes = doc.querySelectorAll("osm:root > node");
  const nodeMap = new Map<string, OsmNode>([...nodes].map((e) => [e.id, deserializeOsmNode(e)]));
  const ways = doc.querySelectorAll("osm:root > way");
  const wayMap = new Map<string, OsmWay>([...ways].map((e) => [e.id, deserializeOsmWay(e)]));

  validateAllWayNodesPresent(wayMap.values(), nodeMap);
  validateNoClosedWays(wayMap.values());

  const overallNodeList = buildOverallNodeList(wayMap, nodeMap);
  console.log(overallNodeList.length, "/", nodeMap.size);
  return overallNodeList;
}

function validateAllWayNodesPresent(ways: Iterable<OsmWay>, nodeMap: Map<string, OsmNode>) {
  const missingNodeRefs = [];
  for (const way of ways) {
    const nodeRefs = way.nodeRefs;
    for (const nodeRef of nodeRefs) {
      if (!nodeMap.has(nodeRef)) {
        missingNodeRefs.push(`way#${way.id} nd#${nodeRef}`);
      }
    }
  }
  if (missingNodeRefs.length > 0) {
    throw new Error("The following way nodes were not found as <node>s: \n" + missingNodeRefs.join(",\n"));
  }
}

function validateNoClosedWays(ways: Iterable<OsmWay>) {
  for (const way of ways) {
    const nodeRefs = way.nodeRefs;
    if (nodeRefs[0] === nodeRefs[nodeRefs.length - 1]) {
      throw new Error(`Way #${way.id} is closed (start = end = node #${nodeRefs[0]})`);
    }
  }
}

class NodeOccurrence {
  constructor(public readonly way: OsmWay, public readonly index: number) {}
  isFirstInWay(): boolean {
    return this.index === 0;
  }
  isLastInWay(): boolean {
    return this.index === this.way.nodeRefs.length - 1;
  }
  isFirstOrLastInWay(): boolean {
    return this.isFirstInWay() || this.isLastInWay();
  }
  toString(): string {
    return `way#${this.way.id}@${this.index}/${this.way.nodeRefs.length}`;
  }
}

function buildOverallNodeList(wayMap: Map<string, OsmWay>, nodeMap: Map<string, OsmNode>): OsmNode[] {
  const nodeWayMap: Record<string, NodeOccurrence[]> = {};
  for (const way of wayMap.values()) {
    way.nodeRefs.forEach((nodeRef, index) => {
      if (!(nodeRef in nodeWayMap)) {
        nodeWayMap[nodeRef] = [];
      }
      nodeWayMap[nodeRef].push(new NodeOccurrence(way, index));
    });
  }
  const doubleOccurrences = Object.entries(nodeWayMap).filter(([nodeRef, occurrences]) => {
    if (occurrences.length > 2) {
      const occurrencesStr = occurrences.map((n) => n.toString()).join("\n");
      throw new Error(`Node#${nodeRef} is referenced in ${occurrences.length} ways:\n` + occurrencesStr);
    }
    if (occurrences.length === 2) {
      const [occ1, occ2] = occurrences;
      if (!(occ1.isFirstOrLastInWay() && occ2.isFirstOrLastInWay())) {
        throw new Error(`Node#${nodeRef} occurs in ${occ1} and ${occ2}, but isn't a first-or-last in both ways`);
      }
      return true;
    }
    return false;
  }) as [string, [NodeOccurrence, NodeOccurrence]][];
  if (doubleOccurrences.length === 0) {
    throw new Error(`No nodes occur in two ways`);
  }
  const [firstDoubleOccurrence, ...restDoubleOccurrence] = doubleOccurrences;
  const doubleOccurrenceNodeMap = new Map(restDoubleOccurrence);
  const overallNodeRefList: string[] = [];
  const processedWays = new Set<OsmWay>();

  {
    const [, [occ1, occ2]] = firstDoubleOccurrence;
    const occ1NodeRefs = occ1.isLastInWay() ? occ1.way.nodeRefs : [...occ1.way.nodeRefs].reverse();
    const occ2NodeRefs = occ2.isFirstInWay() ? occ2.way.nodeRefs : [...occ2.way.nodeRefs].reverse();
    if (last(occ1NodeRefs) !== first(occ2NodeRefs)) throw new Error("last(occ1NodeRefs) !== first(occ2NodeRefs)");
    overallNodeRefList.push(...occ1NodeRefs, ...occ2NodeRefs.slice(1));
    processedWays.add(occ1.way);
    processedWays.add(occ2.way);
  }

  while (doubleOccurrenceNodeMap.size > 0) {
    const firstNodeRef = first(overallNodeRefList);
    const doubleOccurrenceFront = doubleOccurrenceNodeMap.get(firstNodeRef);
    if (!isUndefined(doubleOccurrenceFront)) {
      doubleOccurrenceNodeMap.delete(firstNodeRef);
      const [occ1, occ2] = doubleOccurrenceFront;
      if (processedWays.has(occ1.way) && processedWays.has(occ2.way))
        throw new Error("processedWays.has(occ1.way) && processedWays.has(occ2.way)");
      if (!processedWays.has(occ1.way)) {
        const occ1NodeRefs = occ1.isLastInWay() ? occ1.way.nodeRefs : [...occ1.way.nodeRefs].reverse();
        overallNodeRefList.unshift(...occ1NodeRefs.slice(0, -1));
        processedWays.add(occ1.way);
      } else {
        const occ2NodeRefs = occ2.isLastInWay() ? occ2.way.nodeRefs : [...occ2.way.nodeRefs].reverse();
        overallNodeRefList.unshift(...occ2NodeRefs.slice(0, -1));
        processedWays.add(occ2.way);
      }
      continue;
    }

    const lastNodeRef = last(overallNodeRefList);
    const doubleOccurrenceBack = doubleOccurrenceNodeMap.get(lastNodeRef);
    if (!isUndefined(doubleOccurrenceBack)) {
      doubleOccurrenceNodeMap.delete(lastNodeRef);
      const [occ1, occ2] = doubleOccurrenceBack;
      if (processedWays.has(occ1.way) && processedWays.has(occ2.way))
        throw new Error("processedWays.has(occ1.way) && processedWays.has(occ2.way)");

      if (!processedWays.has(occ1.way)) {
        const occ1NodeRefs = occ1.isFirstInWay() ? occ1.way.nodeRefs : [...occ1.way.nodeRefs].reverse();
        overallNodeRefList.push(...occ1NodeRefs.slice(1));
        processedWays.add(occ1.way);
      } else {
        const occ2NodeRefs = occ2.isFirstInWay() ? occ2.way.nodeRefs : [...occ2.way.nodeRefs].reverse();
        overallNodeRefList.push(...occ2NodeRefs.slice(1));
        processedWays.add(occ2.way);
      }

      continue;
    }

    throw new Error(
      `doubleOccurrenceNodeMap.size==${doubleOccurrenceNodeMap.size} but contains neither node#${firstNodeRef} nor node#${lastNodeRef}`
    );
  }

  const overallNodeRefSet = new Set(overallNodeRefList);
  if (overallNodeRefList.length !== overallNodeRefSet.size)
    throw new Error(
      `overallNodeRefList.length ${overallNodeRefList.length} !== overallNodeRefSet.size ${overallNodeRefSet.size}`
    );

  return overallNodeRefList.map((nodeRef) => nodeMap.get(nodeRef)!);
}

function first<T>(array: T[]): T {
  return array[0];
}
function last<T>(array: T[]): T {
  return array[array.length - 1];
}

function deserializeOsmNode(e: Element): OsmNode {
  const id = checkAndGetAttribute(e, "id");
  const latStr = checkAndGetAttribute(e, "lat");
  const lat = Number.parseFloat(latStr);
  const lngStr = checkAndGetAttribute(e, "lon");
  const lng = Number.parseFloat(lngStr);
  const tags: TagSet = {};
  for (const childNode of e.childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      if ((childNode.textContent?.trim().length ?? 0) > 0) {
        throw new Error("Node has a non-blank text node as child: " + e.outerHTML);
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      const childElement = childNode as Element;
      if (childElement.tagName.toUpperCase() !== "TAG") {
        throw new Error("Node has children that are not <tag>s: " + e.outerHTML);
      }
      const key = checkAndGetAttribute(childElement, "k");
      const value = checkAndGetAttribute(childElement, "v");
      if (key in tags) {
        throw new Error(`Duplicate key ${key} in tags of node ${e.outerHTML}`);
      }
      tags[key] = value;
    } else {
      throw new Error("Node has children that are not elements or blank text nodes: " + e.outerHTML);
    }
  }
  return { id, coord: { lat, lng }, tags };
}

const ignoredWayChildElements = ["BOUNDS"];
function deserializeOsmWay(e: Element): OsmWay {
  const id = checkAndGetAttribute(e, "id");
  const nodeRefs: string[] = [];
  const tags: TagSet = {};
  for (const childNode of e.childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      if ((childNode.textContent?.trim().length ?? 0) > 0) {
        throw new Error("Node has a non-blank text node as child: " + e.outerHTML);
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      const childElement = childNode as Element;
      const tagName = childElement.tagName.toUpperCase();
      if (tagName === "TAG") {
        const key = checkAndGetAttribute(childElement, "k");
        const value = checkAndGetAttribute(childElement, "v");
        if (key in tags) {
          throw new Error(`Duplicate key ${key} in tags of node ${e.outerHTML}`);
        }
        tags[key] = value;
      } else if (tagName === "ND") {
        const ref = checkAndGetAttribute(childElement, "ref");
        nodeRefs.push(ref);
      } else if (!ignoredWayChildElements.includes(tagName)) {
        throw new Error(
          `Way has children that are not <tag>s or <nd>s, and not ignored (${ignoredWayChildElements.join(", ")}): ${
            e.outerHTML
          }`
        );
      }
    } else {
      throw new Error("Way has children that are not elements: " + e.textContent);
    }
  }
  return { id, nodeRefs, tags };
}

function checkAndGetAttribute(e: Element, attributeName: string): string {
  const value = e.getAttribute(attributeName);
  if (value === null) throw new Error(`Attribute '${attributeName}' is null or absent on element ${e}`);
  return value;
}
