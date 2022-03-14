import{x as s}from"./app.ee0bf03b.js";import{_ as n}from"./plugin-vue_export-helper.21dcd24c.js";var a="/assets/power-saver-nordpool-events-state.a764b813.png";const t={},p=s('<h1 id="nord-pool-and-events-state-node" tabindex="-1"><a class="header-anchor" href="#nord-pool-and-events-state-node" aria-hidden="true">#</a> Nord Pool and events: state node</h1><h2 id="description" tabindex="-1"><a class="header-anchor" href="#description" aria-hidden="true">#</a> Description</h2><p>In this example, data is read from the Nord Pool sensor in HA via the <code>events: state</code> node. The <code>ps-lowest-price</code> node is used to control a switch, controlled by <code>call service</code> nodes in Home Assistant, to turn on the cheapest 4 hours between 18:00 and 08:00. The schedule is printed to a debug node. The flow is triggered every time the Nord Pool sensor receives new prices.</p><p><img src="'+a+`" alt="Example with Tibber and MQTT"></p><h2 id="flow" tabindex="-1"><a class="header-anchor" href="#flow" aria-hidden="true">#</a> Flow</h2><div class="language-json ext-json"><pre class="language-json"><code><span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;3662aca5.dfe974&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;server-state-changed&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Nord Pool sensor&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    <span class="token property">&quot;exposeToHomeAssistant&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;haConfig&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;name&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;icon&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token property">&quot;entityidfilter&quot;</span><span class="token operator">:</span> <span class="token string">&quot;sensor.nordpool_kwh_trheim_nok_3_095_025&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;entityidfiltertype&quot;</span><span class="token operator">:</span> <span class="token string">&quot;exact&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputinitially&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;state_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;haltifstate&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;halt_if_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;halt_if_compare&quot;</span><span class="token operator">:</span> <span class="token string">&quot;is&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputs&quot;</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    <span class="token property">&quot;output_only_on_state_change&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;for&quot;</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token property">&quot;forType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;num&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;forUnits&quot;</span><span class="token operator">:</span> <span class="token string">&quot;minutes&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ignorePrevStateNull&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ignorePrevStateUnknown&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ignorePrevStateUnavailable&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ignoreCurrentStateUnknown&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ignoreCurrentStateUnavailable&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;payload&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;entityState&quot;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;data&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;eventData&quot;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;topic&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;triggerId&quot;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">120</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">620</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;e21a4b49adea2350&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ed7202ff.b5725&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;debug&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Nord Pool result&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;active&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;tosidebar&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;console&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;tostatus&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;complete&quot;</span><span class="token operator">:</span> <span class="token string">&quot;true&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;targetType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;full&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;statusVal&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;statusType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;auto&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">720</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">680</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;32f17ab2.927cf6&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn on&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    <span class="token property">&quot;debugenabled&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;service_domain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;service&quot;</span><span class="token operator">:</span> <span class="token string">&quot;turn_on&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;entityId&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch.varmtvannsbereder_switch&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;data&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;dataType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;jsonata&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;mergecontext&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;mustacheAltTags&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token property">&quot;queue&quot;</span><span class="token operator">:</span> <span class="token string">&quot;none&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">700</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">580</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2a3cd7db.0891f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn off&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    <span class="token property">&quot;debugenabled&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;service_domain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;service&quot;</span><span class="token operator">:</span> <span class="token string">&quot;turn_off&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;entityId&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch.varmtvannsbereder_switch&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;data&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;dataType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;json&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;mergecontext&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;mustacheAltTags&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token property">&quot;queue&quot;</span><span class="token operator">:</span> <span class="token string">&quot;none&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">700</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">620</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;e21a4b49adea2350&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-receive-price&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Price Receiver&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">310</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">620</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;391ac08890e0dd40&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;391ac08890e0dd40&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-strategy-lowest-price&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Lowest Price&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;fromTime&quot;</span><span class="token operator">:</span> <span class="token string">&quot;18&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;toTime&quot;</span><span class="token operator">:</span> <span class="token string">&quot;08&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;hoursOn&quot;</span><span class="token operator">:</span> <span class="token string">&quot;04&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;doNotSplit&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;sendCurrentValueWhenRescheduling&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputIfNoSchedule&quot;</span><span class="token operator">:</span> <span class="token string">&quot;false&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputOutsidePeriod&quot;</span><span class="token operator">:</span> <span class="token string">&quot;false&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">490</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">620</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;32f17ab2.927cf6&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token string">&quot;2a3cd7db.0891f8&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token string">&quot;ed7202ff.b5725&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;server&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Home Assistant&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
    <span class="token property">&quot;addon&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;rejectUnauthorizedCerts&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;ha_boolean&quot;</span><span class="token operator">:</span> <span class="token string">&quot;y|yes|true|on|home|open&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;connectionDelay&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;cacheJson&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;heartbeat&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;heartbeatInterval&quot;</span><span class="token operator">:</span> <span class="token number">30</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span>
</code></pre></div>`,6);function o(e,u){return p}var l=n(t,[["render",o]]);export{l as default};
