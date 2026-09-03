export const STATUS = Object.freeze({ PENDING:'pending', APPROVED:'approved', REJECTED:'rejected', PURCHASED:'purchased' });

export function parsePrice(value) {
  const normalized = String(value ?? '').replace(/[￥¥,\s]/g, '');
  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function validateRequest(input) {
  const errors = {};
  if (!input.images || input.images.length < 1) errors.images = '请至少上传 1 张商品图片';
  if (input.images?.length > 3) errors.images = '最多上传 3 张商品图片';
  if (!String(input.name ?? '').trim()) errors.name = '请填写商品名称';
  if (parsePrice(input.price) === null) errors.price = '请填写有效价格';
  if (!String(input.reason ?? '').trim()) errors.reason = '请填写购买理由';
  if (String(input.reason ?? '').length > 200) errors.reason = '购买理由最多 200 字';
  if (String(input.link ?? '').trim() && !/^https?:\/\//i.test(String(input.link).trim())) errors.link = '商品链接格式不正确';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function canApprove(status) { return status === STATUS.PENDING; }
export function canReject(status) { return status === STATUS.PENDING; }
export function canResubmit(status) { return status === STATUS.REJECTED; }
export function canMarkPurchased(status) { return status === STATUS.APPROVED; }

export function makeRoomCode(random = Math.random) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i=0;i<6;i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return code;
}
export const generateRoomCode = makeRoomCode;

export function formatStatus(status) {
  return ({pending:'待审批', approved:'已通过', rejected:'已驳回', purchased:'已购买'})[status] ?? status;
}

export function money(value) {
  return new Intl.NumberFormat('zh-CN', { style:'currency', currency:'CNY', minimumFractionDigits:2 }).format(Number(value || 0));
}
