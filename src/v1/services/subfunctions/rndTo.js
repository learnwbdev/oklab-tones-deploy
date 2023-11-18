
const rndTo = (num, mpPrc) => {
    const prc = 10 ** mpPrc;
    return Math.round((num + Number.EPSILON) * prc) / prc + 0;
}

export default rndTo;