// Find convertion path to convert color from colorSpaceFrom to colorSpaceTo
/**
 * Find convertion path to convert color from colorSpaceFrom to colorSpaceTo
 * @param {string} colorSpaceFrom - name of the color space to convert color From (from the list of colorSpaces)
 * @param {string} colorSpaceTo - name of the color space to convert color To (from the list of colorSpaces)
 * @return {string[] | undefined} Array of color spaces for a convertion path (for one-step convertion)
 */

// Breadth First algorithm to find shortest path in a graph from starting Node to a goal Node
/*
      sources:
            https://www.youtube.com/watch?v=tWVWeAqZ0WU&t=5043s
*/

import { convertPathGraphNodes } from "./colorConvertionPaths.js";

export function findColorConvertionPath(colorSpaceFrom, colorSpaceTo) {

      // Breadth First algorithm
      const queue = [ [ colorSpaceFrom, [ colorSpaceFrom ] ] ]; // Node, distance from startNode, array of the nodes along tha path
      const visited = new Set( [colorSpaceFrom] );

      while (queue.length > 0) {
          const [ curNode, curPathArr ] = queue.shift(); // get first element from the queue and remove it from the queue

          if ( curNode === colorSpaceTo ) return curPathArr;

      //     console.log("queue: ", structuredClone(queue)); // structuredClone to show in console not already changed value
      //     console.log("visited: ", structuredClone(visited));
      //     console.log("current: ", curNode, curPathArr);
      //     console.log("Neighbors: ", convertPathGraphNodes[curNode]);

          for (let neighborNode of convertPathGraphNodes[curNode]) {
            if (!visited.has(neighborNode)) {
                queue.push( [ neighborNode, curPathArr.concat(neighborNode) ])
                visited.add(neighborNode);
            }
          }
      }

      return -1; // path was not found (between colorSpaceFrom and colorSpaceTo)
}