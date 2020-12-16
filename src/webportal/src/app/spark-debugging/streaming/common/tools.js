import { log } from "util";

export function dialog(containerCalssName, id, e, table) {
  let top = null;
  let left = null;
  let right = null;
  let timer;
  let parentNode = $(`.content-wrapper ${containerCalssName}`);
  const childNode = $("<div id='dialog'>No detailed jobs data</div>");
  let prevChildNode = null;
  const containerWidth = parentNode.width();
  if (table) {
    parentNode = $(".content-wrapper");
    top = e.clientY;
    left = e.clientX + 20;
    prevChildNode = $(`.content-wrapper #dialog`);
  } else {
    top = e.clientY * (100 / parentNode.height());
    left = e.clientX >= containerWidth ? null : e.clientX - 246;
    right =
      e.clientX < containerWidth ? null : containerWidth - e.clientX + 246;
    prevChildNode = $(`.content-wrapper ${containerCalssName} #dialog`);
  }
  // Delete the previous element
  prevChildNode && prevChildNode.remove();
  timer && window.clearTimeout(timer);

  childNode.css({
    position: "absolute",
    left: left,
    top: top,
    right: right,
    background: "#F4F4F4",
    zIndex: 100,
    color: "#333333",
    padding: 10,
    "font-weight": 400,
    "font-size": 20,
    "word-break": "keep-all",
    "white-space": "nowrap",
  });
  parentNode.append(childNode);

  timer = setTimeout(() => {
    childNode.remove();
  }, 1500);
}
