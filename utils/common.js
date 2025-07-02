export const normalizeText = (text) => {
    // เปลี่ยน code &nbsp เป็น ค่าว่าง
    const codespace = text.replace(/\u00A0/g, ' ');
    // เปลี่ยน ค่าว่างหลายช่อง ให้เป็นค่าว่างช่องเดียว
    return codespace.replace(/\s+/g, ' ');
}