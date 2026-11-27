/* Shared, local-only data for the old community membership review. */
(() => {
  'use strict';
  const storageKey = 'duoyuan-membership-review-v1';
  const dayMs = 86400000;
  const localOffset = 8 * 3600000;
  const baseAccount = 'demo';
  const actions = ['open', 'renew', 'upgrade'];
  const appearances = ['month', 'quarter', 'year', 'jade'];
  const annualGift = 'MakeNow 订阅兑换码';
  const plansSeed = [
    {id:'month', name:'月卡', months:1, price:39, points:390, firstPrice:29, discount:0.95, activityRate:1.1, signRate:2, style:'青萤', gift:''},
    {id:'quarter', name:'季卡', months:3, price:99, points:990, firstPrice:89, discount:0.9, activityRate:1.2, signRate:3, style:'紫曜', gift:''},
    {id:'year', name:'年卡', months:12, price:199, points:1990, firstPrice:169, discount:0.85, activityRate:1.5, signRate:4, style:'鎏金', gift:annualGift}
  ];
  const iso = stamp => new Date(stamp).toISOString();
  const nowISO = () => iso(Date.now());
  const localDay = () => iso(Date.now() + localOffset).slice(0, 10);
  const id = prefix => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
  const round = value => Math.round(value + 1e-9);
  function requireValue(ok, message) { if (!ok) throw new Error(message); }

  function durationLabel(unit, count) {
    if (unit === 'day') return count + ' 天';
    return count === 12 ? '1 年' : count + ' 个月';
  }
  function endAfter(start, unit, count) {
    const startTime = Date.parse(start);
    if (unit === 'day') return iso(startTime + count * dayMs);
    const date = new Date(startTime + localOffset);
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + count);
    const endOfMonth = new Date(date);
    endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(originalDay, endOfMonth.getUTCDate()));
    return iso(date.getTime() - localOffset);
  }
  function normalizeDuration(item, unit, count) {
    item.periodUnit = unit;
    item.periodCount = count;
    item.months = unit === 'month' ? count : null;
    item.durationLabel = durationLabel(unit, count);
  }
  function initUser(preset) {
    const user = {
      loggedIn:preset !== 'guest', tier:null, expiresAt:null, permanent:0, limited:[],
      firstUsed:false, wear:true, wearFrame:true, signedDay:null, signAward:0, taskAward:null, usedCampaigns:[], tasks:{}
    };
    if (['month','year','expired','support'].includes(preset)) {
      user.tier = preset === 'month' ? 'month' : 'year';
      user.expiresAt = iso(Date.now() + (preset === 'expired' ? -2 : 20) * dayMs);
      user.permanent = 100;
      user.limited = [{points:35,expiresAt:iso(Date.now()+dayMs*3)}, {points:9,expiresAt:iso(Date.now()+dayMs)}];
      user.firstUsed = true;
    }
    return user;
  }
  function seed(preset='new') {
    const time = Date.now();
    const user = initUser(preset);
    const state = {
      version:2, accountId:baseAccount, accounts:{[baseAccount]:user}, user, plans:structuredClone(plansSeed), orders:[], logs:[],
      campaigns:[{id:'welcome-week',name:'会员体验周',planIds:['month'],actions:['open'],price:25,start:iso(time-2*dayMs),end:iso(time+5*dayMs),enabled:true}],
      codes:['nocodes','support'].includes(preset) ? [] : ['DEMO-MK-0001','DEMO-MK-0002'].map(value=>({value,status:'available',orderId:null})),
      activityBudget:{pending:0,used:0}
    };
    if (['support','expired'].includes(preset)) {
      const at = preset === 'expired' ? endAfter(user.expiresAt,'month',-12) : iso(time-dayMs);
      const historic = {
        id:preset === 'expired' ? 'DEMO-ORDER-EXPIRED' : 'DEMO-ORDER-01',
        planId:'year',planName:'年卡',action:'open',amount:199,points:1990,months:12,expiry:user.expiresAt,
        createdAt:at,paidAt:at,payBy:at,status:'paid',code:null,gift:annualGift,giftStatus:'pending',source:'profile',offer:'常规价',note:''
      };
      if (preset === 'expired') assignCode(state,historic);
      if (preset === 'support') user.permanent = 1990;
      state.orders.push(historic);
    }
    return state;
  }
  function load() {
    const stored = localStorage.getItem(storageKey);
    const state = stored ? JSON.parse(stored) : seed();
    state.version=2;
    state.accountId ||= baseAccount;
    state.accounts ||= {[state.accountId]:state.user};
    state.user = state.accounts[state.accountId];
    state.activityBudget ||= {pending:0,used:0};
    for (const user of Object.values(state.accounts)) {
      user.wearFrame ??= true;
      user.tasks ||= {};
      user.signAwards ||= {};
      if (user.signedDay) user.signAwards[user.signedDay] ??= user.signAward;
      if (user.taskAward != null && !user.tasks.main) {
        user.tasks.main = {id:'main',points:user.taskAward,status:'awarded',tier:null};
        state.activityBudget.used += user.taskAward;
      }
    }
    for (const [position, plan] of state.plans.entries()) {
      normalizeDuration(plan,plan.periodUnit || 'month',plan.periodCount ?? plan.months);
      plan.order ??= position + 1;
      plan.appearance ||= appearances.includes(plan.id) ? plan.id : 'jade';
      plan.pointsMode ||= 'fixed';
    }
    state.plans.sort((a,b)=>a.order-b.order);
    for (const order of state.orders) {
      order.accountId ||= baseAccount;
      const plan = state.plans.find(item=>item.id===order.planId);
      normalizeDuration(order,order.periodUnit || 'month',order.periodCount ?? order.months ?? plan?.months ?? 12);
      order.gift ??= order.planId==='year' ? annualGift : '';
      order.offerType ||= 'regular';
      order.memberStatus ||= order.status==='paid' ? 'done' : 'waiting';
      order.pointsStatus ||= order.status==='paid' ? 'done' : 'waiting';
      order.completed = order.memberStatus==='done' && order.pointsStatus==='done';
      if (order.status==='paid') order.receivedAt ||= order.paidAt;
      if (order.status==='pending' && Date.parse(order.payBy)<=Date.now()) order.status='expired';
    }
    for (const order of state.orders) {
      if (order.status!=='pending') continue;
      const reason=orderValidity(state,order);
      if (reason) {
        order.status='invalid';
        order.invalidReason=reason;
      }
    }
    return state;
  }
  const save = state => {
    localStorage.setItem(storageKey,JSON.stringify(state));
    window.dispatchEvent(new Event('community-membership-updated'));
  };
  function change(fn) {
    const state = load();
    const result = fn(state);
    save(state);
    return result;
  }
  function audit(state, text, details={}) { state.logs.unshift({at:nowISO(),text,...details}); }
  function findPlan(state,tier) {
    const plan = state.plans.find(item=>item.id===tier);
    requireValue(plan,'请选择会员档位');
    return plan;
  }
  function active(user,time=Date.now()) {
    return Date.parse(user.expiresAt)>time ? user.tier : null;
  }
  function available(user) {
    return user.limited.filter(batch=>Date.parse(batch.expiresAt)>Date.now() && batch.points>0);
  }
  function total(user) { return available(user).reduce((sum,batch)=>sum+batch.points,user.permanent); }
  function purchase(state,user,plan,time=Date.now()) {
    const current = active(user,time);
    const action = !current ? 'open' : current===plan.id ? 'renew' : 'upgrade';
    const allowed = !current || findPlan(state,current).order<=plan.order;
    return {current,action,allowed};
  }
  function quote(state,tier) {
    const plan=findPlan(state,tier), user=state.user;
    const {current,action,allowed}=purchase(state,user,plan);
    const q={
      planId:tier,allowed,reason:allowed?'':'当前会员到期后可开通',action,
      amount:plan.price,regular:plan.price,offer:'常规价',offerType:'regular',campaignId:null,
      points:plan.points,expiry:endAfter(current?user.expiresAt:nowISO(),plan.periodUnit,plan.periodCount)
    };
    normalizeDuration(q,plan.periodUnit,plan.periodCount);
    if (!user.loggedIn || !allowed) return q;
    if (!user.firstUsed && plan.firstPrice!=null) {
      q.amount=plan.firstPrice; q.offer='首充优惠'; q.offerType='first';
    }
    const time=Date.now();
    const campaign=state.campaigns.find(c=>c.enabled && Date.parse(c.start)<=time && time<Date.parse(c.end)
      && c.planIds.includes(tier) && c.actions.includes(action) && !user.usedCampaigns.includes(c.id));
    if (campaign && campaign.price<q.amount) {
      q.amount=campaign.price; q.offer=campaign.name; q.offerType='campaign'; q.campaignId=campaign.id; q.campaignEnd=campaign.end;
    }
    return q;
  }
  function orderValidity(state,order) {
    if (order.status==='confirming') return '正在确认支付结果';
    if (order.status==='paid') return '这笔订单已收款';
    if (order.status==='expired') return '订单已超时，请重新下单';
    if (order.status==='cancelled') return '此订单已取消';
    if (order.status==='invalid') return order.invalidReason;
    const user=state.accounts[order.accountId];
    const buying=purchase(state,user,findPlan(state,order.planId));
    if (!buying.allowed) return '当前档位已高于原订单档位，请重新选择可买档位';
    if (buying.action!==order.action) return '会员状态已变化，请确认新的购买方式和价格';
    if (order.offerType==='first' && user.firstUsed) return '首充资格已使用，请重新下单';
    if (order.campaignId && user.usedCampaigns.includes(order.campaignId)) return '本场优惠已使用，请重新下单';
    return '';
  }
  function startOrder(tier,source='member') {
    return change(state=>{
      const user=state.user;
      requireValue(user.loggedIn,'请先登录');
      const q=quote(state,tier);
      requireValue(q.allowed,q.reason);
      const old=state.orders.find(order=>order.accountId===state.accountId
        && (order.status==='confirming' || (order.status==='pending' && !orderValidity(state,order)))
        && (order.planId===tier || (q.offerType==='first' && order.offerType==='first')
          || (q.campaignId && q.campaignId===order.campaignId)));
      if (old) return old;
      const plan=findPlan(state,tier);
      const order={
        ...q,id:id('M'),accountId:state.accountId,planName:plan.name,gift:plan.gift,source,createdAt:nowISO(),
        payBy:iso(Date.now()+15*60000),status:'pending',memberStatus:'waiting',pointsStatus:'waiting',
        completed:false,code:null,giftStatus:'none',note:''
      };
      state.orders.unshift(order);
      return order;
    });
  }
  function findOrder(state,key,own=false) {
    const order=state.orders.find(item=>item.id===key && (!own || item.accountId===state.accountId));
    requireValue(order,'未找到这笔订单');
    return order;
  }
  function assignCode(state,order) {
    if (order.code) return true;
    const entry=state.codes.find(code=>code.status==='available');
    if (!entry) { order.giftStatus='pending'; return false; }
    entry.status='sent'; entry.orderId=order.id; order.code=entry.value; order.giftStatus='sent';
    return true;
  }
  function applyOrderPart(state,order,part) {
    const user=state.accounts[order.accountId];
    if (part==='member') {
      if (order.memberStatus==='done') return;
      if (order.basisExpiry!==user.expiresAt && active(user,Date.parse(order.paidAt))) {
        const current=findPlan(state,user.tier);
        const purchased=findPlan(state,order.planId);
        order.expiry=endAfter(user.expiresAt,order.periodUnit,order.periodCount);
        user.tier=current.order>purchased.order ? current.id : purchased.id;
      } else {
        user.tier=order.planId;
      }
      user.expiresAt=order.expiry;
      order.memberStatus='done';
    } else {
      if (order.pointsStatus==='done') return;
      user.permanent+=order.points;
      order.pointsAwardedAt=nowISO();
      order.pointsStatus='done';
    }
    order.completed=order.memberStatus==='done' && order.pointsStatus==='done';
    if (order.completed) delete order.failureReason;
  }
  function paidTime(order,rawTime=nowISO()) {
    const stamp=Date.parse(rawTime);
    requireValue(stamp>=Date.parse(order.createdAt) && stamp<Date.parse(order.payBy) && stamp<=Date.now(),
      '付款时间不在订单有效期内，请核对支付结果');
    return iso(stamp);
  }
  function collect(state,order,at,fail) {
    const user=state.accounts[order.accountId];
    const basisExpiry=order.basisExpiry===undefined ? user.expiresAt : order.basisExpiry;
    const base=order.action!=='open' && Date.parse(basisExpiry)>Date.parse(at) ? basisExpiry : at;
    order.basisExpiry=basisExpiry;
    order.expiry=endAfter(base,order.periodUnit,order.periodCount);
    order.status='paid'; order.paidAt=at; order.receivedAt=nowISO();
    user.firstUsed=true;
    if (order.campaignId && !user.usedCampaigns.includes(order.campaignId)) user.usedCampaigns.push(order.campaignId);
    if (fail==='member') order.memberStatus='failed';
    else applyOrderPart(state,order,'member');
    if (fail==='points') order.pointsStatus='failed';
    else applyOrderPart(state,order,'points');
    if (order.gift) assignCode(state,order);
    if (fail==='member') order.failureReason='会员开通异常，正在处理';
    if (fail==='points') order.failureReason='积分到账异常，正在处理';
    audit(state,order.completed?'会员订单已收款，会员和积分均已到账':'会员订单已收款，部分权益等待处理',{orderId:order.id});
    return order;
  }
  function startPayment(state,order) {
    const reason=orderValidity(state,order);
    if (!reason) return true;
    if (order.status==='pending') {
      order.status='invalid';
      order.invalidReason=reason;
      return false;
    }
    requireValue(false,reason);
  }
  function pay(key,{fail}={}) {
    return change(state=>{
      const order=findOrder(state,key,true);
      if (['paid','confirming','invalid'].includes(order.status)) return order;
      if (!startPayment(state,order)) return order;
      return collect(state,order,paidTime(order),fail);
    });
  }
  function markPaymentPending(key,{paidAt}={}) {
    return change(state=>{
      const order=findOrder(state,key,true);
      if (['confirming','paid','invalid'].includes(order.status)) return order;
      if (!startPayment(state,order)) return order;
      if (paidAt) order.simulatedPaidAt=paidTime(order,paidAt);
      order.basisExpiry=state.user.expiresAt;
      order.status='confirming';
      return order;
    });
  }
  function confirmPayment(key,{paidAt,fail,failed}={}) {
    return change(state=>{
      const order=findOrder(state,key,true);
      if (order.status==='paid') return order;
      requireValue(order.status==='confirming' || (order.status==='expired' && paidAt),
        '该订单没有待确认的支付结果');
      if (failed) {
        order.status=Date.now()<Date.parse(order.payBy) ? 'pending' : 'expired';
        delete order.simulatedPaidAt;
        delete order.basisExpiry;
        return order;
      }
      return collect(state,order,paidTime(order,paidAt || order.simulatedPaidAt),fail);
    });
  }
  function orderState(key) {
    const state=load(), order=findOrder(state,key,true);
    const reason=orderValidity(state,order);
    if (order.status==='pending' && reason) {
      order.status='invalid'; order.invalidReason=reason;
    }
    return {allowed:!reason,reason,order};
  }
  function repair(key,part) {
    return change(state=>{
      const order=findOrder(state,key);
      requireValue(order.status==='paid','请先核对订单收款结果');
      requireValue(['member','points'].includes(part),'请选择要恢复的权益');
      const field=part==='member'?'memberStatus':'pointsStatus';
      if (order[field]==='done') return order;
      requireValue(order[field]==='failed','该项当前无需补发');
      applyOrderPart(state,order,part);
      audit(state,part==='member'?'已恢复会员权益':'已补发永久积分',{orderId:order.id});
      return order;
    });
  }

  function reward(state,base,mode,tier) {
    const plan=tier ? findPlan(state,tier) : null;
    return round(base * (plan ? (mode==='sign'?plan.signRate:plan.activityRate) : 1));
  }
  function cost(state,base,mode) {
    const tier=active(state.user);
    return round(base*(tier && mode==='store'?findPlan(state,tier).discount:1));
  }
  function spend(base,mode,expectedAmount,product) {
    return change(state=>{
      const user=state.user;
      requireValue(user.loggedIn,'请先登录');
      requireValue(Number.isFinite(base) && base>=0,'无效积分数量');
      const amount=cost(state,base,mode);
      if (mode==='store' && expectedAmount!==undefined && expectedAmount!==amount) {
        throw Object.assign(new Error('会员兑换价已变化，请按新价格确认'),{code:'PRICE_CHANGED',amount});
      }
      const balance=total(user);
      requireValue(balance>=amount,'积分不足，还差 '+(amount-balance)+' 积分');
      let remaining=amount;
      for (const batch of available(user).sort((a,b)=>Date.parse(a.expiresAt)-Date.parse(b.expiresAt))) {
        const used=Math.min(batch.points,remaining); batch.points-=used; remaining-=used;
        if (!remaining) break;
      }
      user.permanent-=remaining;
      if (mode==='store' && product?.id && product?.name) {
        user.redemptions ||= [];
        user.redemptions.unshift({id:product.id,name:product.name,points:amount,at:nowISO()});
      }
      audit(state,(mode==='store'?'商城兑换':'生成')+'消耗 '+amount+' 积分');
      return amount;
    });
  }
  function addReward(user,points,rewardId) {
    user.limited.push({expiresAt:iso(Date.now()+30*dayMs),points,rewardId});
  }
  function sign(state,base) {
    const user=state.user;
    requireValue(user.loggedIn,'请先登录');
    if (user.signedDay===localDay()) return user.signAward;
    const points=reward(state,base,'sign',active(user));
    addReward(user,points);
    user.signedDay=localDay(); user.signAward=points;
    user.signAwards[user.signedDay]=points;
    audit(state,'签到获得 '+points+' 积分');
    return points;
  }
  function achieve(state,base,taskId) {
    const user=state.user;
    requireValue(user.loggedIn,'请先登录');
    if (Object.hasOwn(user.tasks,taskId)) return user.tasks[taskId];
    const tier=active(user);
    const entry={
      id:taskId,rewardId:id('R'),tier,points:reward(state,base,'task',tier),achievedAt:nowISO(),status:'pending'
    };
    Object.defineProperty(user.tasks,taskId,{value:entry,enumerable:true});
    if (taskId==='main') user.taskAward=entry.points;
    state.activityBudget.pending+=entry.points;
    audit(state,'活动达标，确定 '+entry.points+' 积分',{rewardId:entry.rewardId});
    return entry;
  }
  function release(state,taskId) {
    const user=state.user;
    requireValue(user.loggedIn,'请先登录');
    const entry=Object.hasOwn(user.tasks,taskId) ? user.tasks[taskId] : null;
    requireValue(entry,'请先完成任务');
    if (entry.status==='awarded') return entry;
    entry.status='awarded';
    entry.awardedAt=nowISO();
    addReward(user,entry.points,entry.rewardId);
    state.activityBudget.pending-=entry.points;
    state.activityBudget.used+=entry.points;
    audit(state,'活动积分已到账 '+entry.points+' 分',{rewardId:entry.rewardId});
    return entry;
  }

  function validatePlan(state,plan,patch,existing) {
    const editable=['name','price','points','pointsMode','pointRate','firstPrice','discount','activityRate','signRate','style','appearance'];
    for (const key of editable) if (key in patch) plan[key]=patch[key];
    if (plan.id==='year' && 'gift' in patch) {
      plan.gift=String(patch.gift || '').trim();
      requireValue(plan.gift,'请填写年卡赠礼说明');
    }
    const unit=patch.periodUnit ?? plan.periodUnit ?? 'month';
    const count=patch.periodCount ?? patch.months ?? plan.periodCount ?? plan.months;
    normalizeDuration(plan,unit,count);
    requireValue(['day','month'].includes(unit) && Number.isSafeInteger(count) && count>0 && count<1000000,
      '请填写有效的会员时长');
    requireValue(String(plan.name || '').trim() && Number.isFinite(plan.price) && plan.price>0,'请填写有效名称和价格');
    requireValue(['fixed','rate'].includes(plan.pointsMode),'请选择赠分配置方式');
    if (plan.pointsMode==='rate') {
      requireValue(Number.isFinite(plan.pointRate) && plan.pointRate>=0,'请填写有效积分换算关系');
      plan.points=round(plan.price*plan.pointRate);
    }
    requireValue(Number.isSafeInteger(plan.points) && plan.points>=0,'请填写有效的开通积分');
    requireValue(plan.firstPrice==null || (Number.isFinite(plan.firstPrice) && plan.firstPrice>0 && plan.firstPrice<=plan.price),
      '首充价应大于零且不高于常规售价');
    requireValue(Number.isFinite(plan.discount) && plan.discount>0 && plan.discount<=1
      && [plan.activityRate,plan.signRate].every(value=>Number.isFinite(value) && value>=1),'请填写有效的商城折扣和奖励倍率');
    if (existing) {
      requireValue(plan.discount<=existing.discount && plan.activityRate>=existing.activityRate && plan.signRate>=existing.signRate,
        '已开售档位的商城折扣和奖励倍率只可调优');
    }
    requireValue(appearances.includes(plan.appearance),'请选择有效的装扮样式');
    plan.name=String(plan.name).trim();
    plan.style=String(plan.style || '').trim();
    requireValue(!state.plans.some(item=>item.id!==plan.id && item.name===plan.name),'档位名称已存在');
  }
  function placePlan(state,plan,afterId) {
    const others=state.plans.filter(item=>item.id!==plan.id);
    const slot=afterId==='' ? 0 : afterId==null ? others.length : others.findIndex(item=>item.id===afterId)+1;
    requireValue(afterId==='' || afterId==null || slot>0,'请选择有效的升档顺序');
    others.splice(slot,0,plan);
    others.forEach((item,position)=>item.order=position+1);
    state.plans=others;
  }
  function createPlan(patch,afterId=patch.insertAfterId) {
    return change(state=>{
      const plan={id:id('plan'),pointsMode:'fixed',firstPrice:null,style:'',appearance:'jade',gift:''};
      validatePlan(state,plan,patch);
      placePlan(state,plan,afterId);
      audit(state,'开售'+plan.name+'档位');
      return plan;
    });
  }
  function updatePlan(tier,patch) {
    return change(state=>{
      const existing=findPlan(state,tier);
      const plan={...existing};
      validatePlan(state,plan,patch,existing);
      Object.assign(existing,plan);
      if ('insertAfterId' in patch) placePlan(state,existing,patch.insertAfterId);
      audit(state,'更新'+plan.name+'档位');
      return existing;
    });
  }
  function saveCampaign(data) {
    return change(state=>{
      const old=state.campaigns.find(c=>c.id===data.id), campaign={...old,...data,id:old?old.id:id('A')};
      requireValue(String(campaign.name||'').trim() && Number.isFinite(campaign.price) && campaign.price>0
        && Date.parse(campaign.start)<Date.parse(campaign.end),'请填写名称、优惠价和有效起止时间');
      requireValue(Array.isArray(campaign.planIds) && campaign.planIds.length
        && campaign.planIds.every(tier=>state.plans.some(plan=>plan.id===tier)),'请选择参加活动的档位');
      requireValue(Array.isArray(campaign.actions) && campaign.actions.length
        && campaign.actions.every(action=>actions.includes(action)),'请选择购买方式');
      requireValue(!campaign.enabled || campaign.planIds.every(tier=>campaign.price<=findPlan(state,tier).price),'活动价不可高于参加档位的常规售价');
      const clash=state.campaigns.some(other=>other.id!==campaign.id && other.enabled
        && Date.parse(campaign.start)<Date.parse(other.end) && Date.parse(other.start)<Date.parse(campaign.end)
        && other.planIds.some(tier=>campaign.planIds.includes(tier)) && other.actions.some(action=>campaign.actions.includes(action)));
      requireValue(!campaign.enabled || !clash,'该档位、购买方式和时段与另一场活动重叠');
      if (old) Object.assign(old,campaign);
      else state.campaigns.unshift(campaign);
      audit(state,'保存优惠活动：'+campaign.name);
      return campaign;
    });
  }
  function read() {
    const state=load();
    state.orders=state.orders.filter(order=>order.accountId===state.accountId);
    delete state.accounts;
    return state;
  }
  window.Membership={
    read,readAdmin:load,reset(preset){save(seed(preset));return read();},
    publicIdentity(accountId) {
      const user=load().accounts[accountId];
      if (!user) return null;
      const tier=active(user);
      return {tier,wear:Boolean(tier && user.wear),wearFrame:Boolean(tier && user.wearFrame)};
    },
    switchAccount(accountId,preset='new') {
      return change(state=>{
        requireValue(typeof accountId==='string' && /^[A-Za-z0-9_-]{1,30}$/.test(accountId),'请选择演示账号');
        if (!Object.hasOwn(state.accounts,accountId)) {
          Object.defineProperty(state.accounts,accountId,{value:initUser(preset),enumerable:true});
        }
        state.accountId=accountId;
        state.user=state.accounts[accountId];
        return state.user;
      });
    },
    login(){return change(state=>state.user.loggedIn=true);},
    logout(){return change(state=>state.user.loggedIn=false);},
    expireMembership(){return change(state=>{
      requireValue(active(state.user),'当前账号没有有效会员');
      return state.user.expiresAt=iso(Date.now()-1);
    });},
    balance:()=>total(load().user),activeTier:()=>active(load().user),quote:tier=>quote(load(),tier),
    reward:(base,mode,tier)=>{const state=load();return reward(state,base,mode,tier===undefined?active(state.user):tier);},
    cost:(base,mode)=>cost(load(),base,mode),
    storeQuote(base){const state=load();return {amount:cost(state,base,'store'),tier:active(state.user)};},
    startOrder,pay,markPaymentPending,confirmPayment,orderState,repair,
    cancel:key=>change(state=>{
      const order=findOrder(state,key,true);
      requireValue(order.status==='pending','只有待付款订单可以取消');
      order.status='cancelled';return order;
    }),
    sign:(base=10)=>change(state=>sign(state,base)),
    achievement:(base=100)=>change(state=>{achieve(state,base,'main');return release(state,'main').points;}),
    task(taskId='main'){const tasks=load().user.tasks;return Object.hasOwn(tasks,taskId) ? tasks[taskId] : null;},
    achieveTask:(base=100,taskId='main')=>change(state=>achieve(state,base,taskId)),
    releaseTask:(taskId='main')=>change(state=>release(state,taskId)),spend,
    toggleFrame:()=>change(state=>{requireValue(active(state.user),'会员到期后可重新开通');return state.user.wearFrame=!state.user.wearFrame;}),
    toggleWear:()=>change(state=>{requireValue(active(state.user),'会员到期后可重新开通');return state.user.wear=!state.user.wear;}),
    createPlan,updatePlan,saveCampaign,
    importCodes(values,batchName){return change(state=>{
      requireValue(Array.isArray(values),'请填写演示码');
      const entries=[...new Set(values.map(value=>String(value).trim()).filter(Boolean))];
      requireValue(entries.length && entries.every(value=>/^DEMO-[A-Za-z0-9_-]{2,60}$/i.test(value)),'仅可导入 DEMO- 开头的虚构演示码');
      const added=entries.filter(value=>!state.codes.some(code=>code.value===value));
      for (const value of added) state.codes.push({value,status:'available',orderId:null,batchName:String(batchName||'手动导入'),importedAt:nowISO()});
      audit(state,'导入 '+added.length+' 个演示码');return added.length;
    });},
    supply:key=>change(state=>{
      const order=findOrder(state,key);
      requireValue(order.status==='paid' && order.gift,'此订单无需补发');
      if (order.code) return order;
      requireValue(assignCode(state,order),'库存为空，请先导入演示码');
      audit(state,'年卡订单已人工补码',{orderId:key});return order;
    }),
    contact:(key,text)=>change(state=>{
      const order=findOrder(state,key,true), message=String(text||'').trim();
      requireValue(message,'请填写需要客服协助的事项');
      order.request={text:message,at:nowISO()};
      audit(state,'收到会员订单的客服反馈',{orderId:key});
      return order;
    }),
    addServiceNote:(key,text)=>change(state=>{
      const order=findOrder(state,key);
      requireValue(String(text).trim(),'请填写处理说明');
      order.note=String(text).trim();
      order.serviceNotes ||= [];
      order.serviceNotes.unshift({text:order.note,at:nowISO()});
      audit(state,'记录会员订单客服处理：'+order.note,{orderId:key});return order;
    })
  };
  if (!localStorage.getItem(storageKey)) save(seed());
  window.addEventListener('storage',event=>{if(event.key===storageKey)window.dispatchEvent(new Event('membership-changed'));});
})();
