/* AL FAHD - Free GA4 interaction tracking.
   Tracks static property page views and WhatsApp/phone/property-detail clicks.
   Uses the existing GA4 property; no paid service or extra account.
*/
(function () {
  "use strict";
  function getPropertyId() {
    var meta = document.querySelector('meta[name="fahd:property_id"]');
    if (meta && meta.content) return meta.content;
    var match = location.pathname.match(/\/properties\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : "";
  }
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }
  var currentPropertyId = getPropertyId();
  if (currentPropertyId) {
    track("view_property", {
      property_id: currentPropertyId,
      page_path: location.pathname,
      page_location: location.href
    });
  }
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var link = target.closest("a[href]");
    if (!link) return;
    var url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    var params = {
      link_url: url.href,
      link_text: (link.innerText || link.getAttribute("aria-label") || "").trim().slice(0, 100),
      page_path: location.pathname,
      property_id: currentPropertyId || undefined
    };
    if (/^(wa\.me|api\.whatsapp\.com)$/i.test(url.hostname)) {
      track("whatsapp_click", params);
    } else if (url.protocol === "tel:") {
      track("phone_click", params);
    } else if (/\/properties\/[^/]+\/?$/.test(url.pathname)) {
      track("property_detail_click", params);
    }
  }, true);
})();
