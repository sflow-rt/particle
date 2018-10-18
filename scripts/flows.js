// author: InMon Corp.
// version: 0.4
// date: 10/17/2018
// description: Particle flow animation
// copyright: Copyright (c) 2018 InMon Corp.

var groups = {}, options = {};

if(getSystemProperty('particle.velocity')) options.velocity = parseFloat(getSystemProperty('particle.velocity'));
if(getSystemProperty('particle.radius')) options.radius = parseFloat(getSystemProperty('particle.radius'));
if(getSystemProperty('particle.maxProbability')) options.maxProbability = parseFloat(getSystemProperty('particle.maxProbability'));

options.seed=parseInt(getSystemProperty('particle.seed') || '1234');

var agents    = getSystemProperty('particle.agents')    || 'ALL';
var aggMode   = getSystemProperty('particle.aggMode')   || 'MAX';
var maxFlows  = getSystemProperty('particle.maxFlows')  || '100';
var t         = getSystemProperty('particle.t')         || '2';
var n         = getSystemProperty('particle.n')         || 'n';
var filter    = getSystemProperty('particle.filter')    || null;
var demo      = getSystemProperty('particle.demo')      || null;

var typeKey   = 'ipprotocol';
var typeLabel = 'IP Protocol';
var typeName  = {'1':'ICMP','6':'TCP','17':'UDP','47':'GRE','50':'ESP'};

var valueKey   = 'bytes';
var valueLabel = 'Bits per Second';
var valueScale = 8;

var sep = '_SEP_';

var keys = [
  'group:ipsource:particle_compass',
  'ipsource',
  'null:[dns:ipsource]:',
  'null:[country:ipsource:both]:',
  'null:[asn:ipsource:both]:',
  'group:ipdestination:particle_compass',
  'ipdestination',
  'null:[dns:ipdestination]:',
  'null:[country:ipdestination:both]:',
  'null:[asn:ipdestination:both]:',
  typeKey
];

if(demo) {
  options.axisN = 'Internet';
  options.axisS = 'Campus';
  options.axisW = 'Datacenter';
  options.axisE = 'Remote';
} else {
  if(getSystemProperty('particle.cidrN')) groups.N = getSystemProperty('particle.cidrN').split(',');
  if(getSystemProperty('particle.cidrS')) groups.S = getSystemProperty('particle.cidrS').split(',');
  if(getSystemProperty('particle.cidrE')) groups.E = getSystemProperty('particle.cidrE').split(',');
  if(getSystemProperty('particle.cidrW')) groups.W = getSystemProperty('particle.cidrW').split(',');
  if(getSystemProperty('particle.axisN')) options.axisN = getSystemProperty('particle.axisN');
  if(getSystemProperty('particle.axisS')) options.axisS = getSystemProperty('particle.axisS');
  if(getSystemProperty('particle.axisE')) options.axisE = getSystemProperty('particle.axisE');
  if(getSystemProperty('particle.axisW')) options.axisW = getSystemProperty('particle.axisW');

  setGroups('particle_compass',groups);

  setFlow('particle_pair',
    {keys:keys,value:valueKey,filter:filter,n:20,t:t,fs:sep});

  setFlow('particle_source',
    {keys:'ipsource',value:valueKey,filter:filter,n:20,t:t,fs:sep});

  setFlow('particle_destination',
    {keys:'ipdestination',value:valueKey,filter:filter,n:20,t:t,fs:sep});

  setFlow('particle_sourcepair',
    {keys:keys,value:valueKey,filter:'group:ipsource:particle_sd=s'+(filter?'&('+filter+')':''),n:20,t:t,fs:sep});

  setFlow('particle_destinationpair',
    {keys:keys,value:valueKey,filter:'group:ipdestination:particle_sd=d'+(filter?'&('+filter+')':''),n:20,t:t,fs:sep});
}

function frequency(val) {
  return Math.log10(val);
}

var suffixes = ["\uD835\uDF07","\uD835\uDC5A","","K","M","G","T","P","E"];

function valueStr(value,includeMillis,base2) {
  if (value === 0) return value;
  var i = 2;
  var divisor = 1;
  var factor = base2 ? 1024 : 1000;
  var absVal, scaled;
  if (includeMillis) {
    i = 0;
    divisor = base2 ? 1/(1024*1024) : 0.000001;
  }
  absVal = Math.abs(value);
  while (i < suffixes.length) {
    if ((absVal / divisor) < factor) break;
    divisor *= factor;
    i++;
  }
  scaled = Math.round(absVal * factor / divisor) / factor;
  return scaled + suffixes[i];
}

function ip2int(ip) {
  return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
}

var cidrRanges = {};
function cidrRange(cidr) {
  var res = cidrRanges[cidr];
  if(res) return res;

  var parts = cidr.split('/');
  var val = ip2int(parts[0]);
  var range = Math.pow(2,32 - (parts.length == 1 ? 32 : parseInt(parts[1]))) - 1;
  res = {start:val,range:range};
  cidrRanges[cidr] = res;
  return res; 
}

function val(side,addr) {
  var ival = ip2int(addr);
  var cidrs = groups[side];
  var total = 0;
  var val = 0;
  for(var i = 0; i < cidrs.length; i++) {
    var res = cidrRange(cidrs[i]);
    if(val === 0 && ival >= res.start && (ival - res.start) <= res.range) val = ival - res.start + total;
    total += res.range;
  }
  return val / total;
}

var flows = [];

function updateFlows() {
  var res,i,rec;
  var keys = {};
  var sumSrc = {};
  var sumDst = {};
  var src = [];
  var dst = [];

  flows = [];

  function processResult(res,sumFlag) {
    for(i = 0; i < res.length; i++) {
      rec = res[i];
      if(keys[rec.key]) continue;

      keys[rec.key] = rec.value;

      let [startSide,startAddr,startName,startCC,startAS,endSide,endAddr,endName,endCC,endAS,type] = rec.key.split(sep);

      if(sumFlag) {
        sumSrc[startAddr] = (sumSrc[startAddr] || 0) + rec.value;
        sumDst[endAddr] = (sumDst[endAddr] || 0) + rec.value;
      }

      flows.push({
        startSide:startSide,
        startVal:val(startSide,startAddr),
        endSide:endSide,
        endVal:val(endSide,endAddr),
        type:type,
        frequency:frequency(rec.value),
        info:[
          {name:'Source Address',value:startAddr,id:'ipsource'},
          {name:'Source Name',value:startName},
          {name:'Source Country',value:startCC},
          {name:'Source AS',value:startAS},
          {name:'Destination Address',value:endAddr,id:'ipdestination'},
          {name:'Destination Name',value:endName},
          {name:'Destination Country',value:endCC},
          {name:'Destination AS',value:endAS},
          {name:typeLabel,value:typeName[type] ? type+'('+typeName[type]+')' : type},
          {name:valueLabel,value:valueStr(rec.value*valueScale,false,false)}
        ]
      });
    }
  }
   
  processResult(activeFlows(agents,'particle_pair',maxFlows,1,aggMode),true);
  processResult(activeFlows(agents,'particle_sourcepair',maxFlows,1,aggMode),false);
  processResult(activeFlows(agents,'particle_destinationpair',maxFlows,1,aggMode),false);
  
  res = activeFlows(agents,'particle_source',maxFlows,1,aggMode);
  for(i = 0; i < res.length; i++) {
    rec = res[i];
    if(((sumSrc[rec.key] || 0) / rec.value) < 0.5) src.push(rec.key); 
  }
  res = activeFlows(agents,'particle_destination',maxFlows,1,aggMode);
  for(i = 0; i < res.length; i++) {
    rec = res[i];
    if(((sumDst[rec.key] || 0) / rec.value) < 0.5) dst.push(rec.key);
  }
  setGroups('particle_sd', {s:src,d:dst});
}

function updateDemo() {
  var i, s, e, sv, ev, type, value, sides=['N','S','E','W'], types = ['1','6','17'], values = [1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10];

  // randomly discard 10% of existing flows
  flows  = flows.filter(x => Math.random() > 0.1);

  // make sure we have 20 flows
  while(flows.length < 20) {
    s = Math.floor(Math.random() * sides.length);
    e = Math.floor(Math.random() * sides.length);
    sv = Math.random();
    ev = Math.random();
    type = types[Math.floor(Math.random() * types.length)];
    value = values[Math.floor(Math.random() * values.length)];
    flows.push({
      startSide:sides[s],
      startVal:sv,
      endSide:sides[e],
      endVal:ev,
      type:type,
      frequency:frequency(value),
      info: [
        {name:'Source Address',value:'10.0.'+s+'.'+Math.floor(sv*256),id:'ipsource'},
        {name:'Source Name',value:(Math.floor(sv*256)+'.'+s+'.0.10.in-addr.arpa.').toLowerCase()},
        {name:'Source Country',value:sides[s]},
        {name:'Source AS',value:'AS6500'+s},
        {name:'Destination Address',value:'10.0.'+e+'.'+Math.floor(ev*256),id:'ipdestination'},
        {name:'Destination Name',value:(Math.floor(ev*256)+'.'+e+'.0.10.in-addr.arpa.').toLowerCase()},
        {name:'Destination Country',value:sides[e]},
        {name:'Destination AS',value:'AS6500'+e},
        {name:typeLabel,value:typeName[type] ? type+'('+typeName[type]+')' : type},
        {name:valueLabel,value:valueStr(value,false,false)}
      ]
    });
  }
}

setIntervalHandler(function(now) {
  if(demo) updateDemo();
  else updateFlows(); 
},1);

setHttpHandler(function(req) {
  var result, path = req.path;
  if(!path || path.length == 0) throw "not_found";
  switch(path[0]) {
    case 'flows':
      result = flows;
      break;
    case 'options':
      result = options;
      break;
  }
  return result;
});
