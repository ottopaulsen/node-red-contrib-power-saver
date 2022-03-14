import{m as t,o as p,d as o,f as s,q as e,F as u,l as n,x as c}from"./app.ee0bf03b.js";import{_ as r}from"./plugin-vue_export-helper.21dcd24c.js";var l="/assets/power-saver-tibber-mqtt.c04fb150.png";const k={},q=s("h1",{id:"tibber-a-switch-and-mqtt",tabindex:"-1"},[s("a",{class:"header-anchor",href:"#tibber-a-switch-and-mqtt","aria-hidden":"true"},"#"),n(" Tibber, a switch and MQTT")],-1),i=s("h2",{id:"description",tabindex:"-1"},[s("a",{class:"header-anchor",href:"#description","aria-hidden":"true"},"#"),n(" Description")],-1),y=n("In this example, data is read from Tibber and used to turn on/off a switch, scheduled by the "),b=s("code",null,"ps-best-save",-1),d=n(" node to be off up to 5 hours in a row, but only if at least 5 cents/\xF8re is saved per kWh. Data is also sent to MQTT, for example to be displayed on "),g={href:"https://magicmirror.builders/",target:"_blank",rel:"noopener noreferrer"},f=n("Magic Mirror"),m=n("."),h=c('<p><img src="'+l+`" alt="Example with Tibber and MQTT"></p><h2 id="flow" tabindex="-1"><a class="header-anchor" href="#flow" aria-hidden="true">#</a> Flow</h2><div class="language-json ext-json"><pre class="language-json"><code><span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;467a5fe.d0bbba&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;mqtt out&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Send switch to MM&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;topic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;powersaver/switch&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;qos&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;retain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;false&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;broker&quot;</span><span class="token operator">:</span> <span class="token string">&quot;24fbcfb5.569ea&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">730</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">120</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ab2d599a.077738&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;tibber-query&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Get Tibber prices&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;active&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;apiEndpointRef&quot;</span><span class="token operator">:</span> <span class="token string">&quot;b70ec5d0.6f8f08&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">470</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;0ef929fde193cf4d&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;4f11b5ae.4cc22c&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;inject&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Refresh&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;props&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
      <span class="token punctuation">{</span>
        <span class="token property">&quot;p&quot;</span><span class="token operator">:</span> <span class="token string">&quot;payload&quot;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token property">&quot;repeat&quot;</span><span class="token operator">:</span> <span class="token string">&quot;3600&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;crontab&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;once&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;onceDelay&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;topic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;payload&quot;</span><span class="token operator">:</span> <span class="token string">&quot;{   viewer {     homes {       currentSubscription{         priceInfo{           today {             total             startsAt           }           tomorrow {             total             startsAt           }         }       }     }   } }&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;payloadType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">280</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;ab2d599a.077738&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;42d8b632.402e38&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;mqtt out&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Send schedule to MM&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;topic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;powersaver/plan&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;qos&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;retain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;true&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;broker&quot;</span><span class="token operator">:</span> <span class="token string">&quot;24fbcfb5.569ea&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">740</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">240</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;5e485ff7.db156&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn on VVB&quot;</span><span class="token punctuation">,</span>
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
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">710</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;9c978d1c.ee76&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn off VVB&quot;</span><span class="token punctuation">,</span>
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
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">710</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">180</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;5b6be1568744c6cf&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-strategy-best-save&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Best Save&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;maxHoursToSaveInSequence&quot;</span><span class="token operator">:</span> <span class="token string">&quot;5&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;minHoursOnAfterMaxSequenceSaved&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;minSaving&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0.05&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;sendCurrentValueWhenRescheduling&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;outputIfNoSchedule&quot;</span><span class="token operator">:</span> <span class="token string">&quot;true&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">490</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">160</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;467a5fe.d0bbba&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;5e485ff7.db156&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token string">&quot;9c978d1c.ee76&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;467a5fe.d0bbba&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token string">&quot;42d8b632.402e38&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0ef929fde193cf4d&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-receive-price&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Price Receiver&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">280</span><span class="token punctuation">,</span>
    <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">160</span><span class="token punctuation">,</span>
    <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">[</span><span class="token string">&quot;5b6be1568744c6cf&quot;</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;24fbcfb5.569ea&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;mqtt-broker&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;MQTT&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;broker&quot;</span><span class="token operator">:</span> <span class="token string">&quot;10.0.0.15&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;port&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1883&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;clientid&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;usetls&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;compatmode&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token property">&quot;keepalive&quot;</span><span class="token operator">:</span> <span class="token string">&quot;60&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;cleansession&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token property">&quot;birthTopic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;birthQos&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;birthPayload&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;closeTopic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;closeQos&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;closePayload&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;willTopic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;willQos&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;willPayload&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;b70ec5d0.6f8f08&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;tibber-api-endpoint&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;feedUrl&quot;</span><span class="token operator">:</span> <span class="token string">&quot;wss://api.tibber.com/v1-beta/gql/subscriptions&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;queryUrl&quot;</span><span class="token operator">:</span> <span class="token string">&quot;https://api.tibber.com/v1-beta/gql&quot;</span><span class="token punctuation">,</span>
    <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Tibber API&quot;</span>
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
</code></pre></div>`,3);function _(v,w){const a=t("ExternalLinkIcon");return p(),o(u,null,[q,i,s("p",null,[y,b,d,s("a",g,[f,e(a)]),m]),h],64)}var M=r(k,[["render",_]]);export{M as default};
