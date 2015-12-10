describe('demo', function () {
    describe('#modules_a', function () {
        expect(modules_a.AAA).to.be.func;
        modules_a.AAA();
        modules_a.AAA_DEP();
    });
});