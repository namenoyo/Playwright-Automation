export const normalizeText = (text) => {
    // เปลี่ยน code &nbsp เป็น ค่าว่าง
    const codespace = String(text).replace(/\u00A0/g, ' ');
    // เปลี่ยน ค่าว่างหลายช่อง ให้เป็นค่าว่างช่องเดียว
    return codespace.replace(/\s+/g, ' ');
}

export const changeobjecttoarray = (dataobject) => {
    const resultchangeobj = dataobject.rows.map(obj => Object.values(obj));
    return resultchangeobj;
}

export const pulldataobjectfromkeys = (dataobject, field) => {
    const resultdatabasekeys = dataobject.rows.map(obj => field.map(key => obj[key]));
    return resultdatabasekeys;
}

export const formatQuery = (query) => {
    return query
    .replace(/--.*$/gm, '')     // ลบ comment `-- ...` ทุกบรรทัด
    .replace(/\s*\n\s*/g, ' ')  // แปลงบรรทัดใหม่เป็น space
    .trim();
}