'use strict'

const Emitter = require('../emitter')
const { create } = require('modules/dashboard')
const widgetBinder = require('../widget-binder')
const renderer = require('./renderer')
const datasourceLoader = require('../datasource-loader')
const parser = require('./parser')
const { stub, useFakeTimers } = require('sinon')
const { expect } = require('code')

describe('dashboard', () => {
  describe('constructor', () => {
    let dashboard
    const descriptor = { name: 'bar', layout: { columns: 4, rows: 6 } }

    beforeEach(() => {
      stub(parser, 'parse').returns(descriptor)
      dashboard = create({}, {
        on: stub()
      })
    })

    afterEach(() => {
      parser.parse.restore()
    })

    it('generates a dashboard id', () => {
      expect(dashboard.id).to.exist()
    })

    it('assigns dashboard name', () => {
      expect(dashboard.name).to.equal(descriptor.name)
    })

    it('assigns dashboard layout', () => {
      expect(dashboard.layout).to.equal(descriptor.layout)
    })

    it('assigns descriptor for future use', () => {
      expect(dashboard.descriptor).to.equal(descriptor)
    })

    it('creates emitter', () => {
      expect(dashboard.emitter).to.be.an.instanceOf(Emitter)
    })
  })

  describe('#loadDatasources()', () => {
    let dashboard

    const emitter = { on: stub() }

    beforeEach(() => {
      stub(parser, 'parse')
    })

    afterEach(() => {
      parser.parse.restore()
    })

    context('empty datasource stanza', () => {
      it('empty datasources when none are specified', () => {
        parser.parse.returns({})
        dashboard = create({}, emitter)
        dashboard.loadDatasources()
        expect(dashboard.datasources).to.equal({})
      })
    })

    context('list of datasources', () => {
      beforeEach(() => {
        parser.parse.returns({
          datasources: {
            foo: { foo: 'bar' }
          }
        })
        stub(datasourceLoader, 'load').returns('bar')

        dashboard = create({}, emitter)
        dashboard.loadDatasources()
      })

      afterEach(() => {
        datasourceLoader.load.restore()
      })

      it('calls loader to load datasources', () => {
        expect(datasourceLoader.load.callCount).to.equal(1)
      })

      it('calls loader to load datasources', () => {
        expect(dashboard.datasources).to.equal('bar')
      })
    })
  })

  describe('#loadWidgets()', () => {
    let dashboard

    const emitter = { on: stub() }

    beforeEach(() => {
      stub(parser, 'parse')
    })

    afterEach(() => {
      parser.parse.restore()
    })

    context('empty widget stanza', () => {
      it('empty widgets when none are specified', () => {
        parser.parse.returns({})
        dashboard = create({}, emitter)
        dashboard.loadWidgets()
        expect(dashboard.widgets).to.equal({})
      })
    })

    context('list of widgets', () => {
      beforeEach(() => {
        parser.parse.returns({
          widgets: [
            { foo: 'bar' }
          ]
        })
        stub(widgetBinder, 'load').returns('bar')

        dashboard = create({}, emitter)
        dashboard.loadWidgets()
      })

      afterEach(() => {
        widgetBinder.load.restore()
      })

      it('calls loader to load widgets', () => {
        expect(widgetBinder.load.callCount).to.equal(1)
      })

      it('calls loader to load widgets', () => {
        expect(dashboard.widgets).to.equal('bar')
      })
    })
  })

  describe('#destroy()', () => {
    let dashboard
    let clock

    beforeEach(() => {
      clock = useFakeTimers()
      stub(parser, 'parse').returns({})
      dashboard = create({}, {
        on: stub()
      })
    })

    afterEach(() => {
      parser.parse.restore()
      clock.restore()
    })

    context('with list of datasources', () => {
      let stub1 = stub()
      let stub2 = stub()

      beforeEach(() => {
        const timer1 = setInterval(stub1, 1)
        const timer2 = setInterval(stub2, 1)
        dashboard.datasources = {
          foo: { timer: timer1 },
          bar: { timer: timer2 }
        }
        dashboard.widgets = []
        clock.tick(1)
      })

      it('clears all timers', () => {
        dashboard.destroy()
        clock.tick(1)
        expect(stub1.callCount).to.equal(1)
        expect(stub1.callCount).to.equal(1)
      })
    })

    context('when no datasources exist', () => {
      it('succeeds silently', () => {
        dashboard.datasources = {}
        expect(() => {
          dashboard.destroy()
        }).not.to.throw()
      })
    })

    context.only('with list of widgets', () => {
      const widgets = [
        { destroy: stub() },
        { }
      ]

      beforeEach(() => {
        dashboard.widgets = widgets
        dashboard.datasources = {}
      })

      it('calls destroy on widgets which support it', () => {
        dashboard.destroy()
        expect(widgets[0].destroy.callCount).to.equal(1)
      })
    })

    context('when no widgets exist', () => {
      it('succeeds silently', () => {
        dashboard.datasources = {}
        expect(() => {
          dashboard.destroy()
        }).not.to.throw()
      })
    })
  })

  describe('#toRenderModel()', () => {
    let dashboard

    const descriptor = {
      name: 'some-name',
      layout: 'some-layout'
    }

    beforeEach(() => {
      stub(parser, 'parse').returns(descriptor)
      stub(renderer, 'buildRenderModel')
      dashboard = create({}, {
        on: stub()
      })
      dashboard.widgets = [{ foo: 'bar' }]
      dashboard.toRenderModel()
    })

    afterEach(() => {
      parser.parse.restore()
      renderer.buildRenderModel.restore()
    })

    it('calls renderer with name', () => {
      expect(renderer.buildRenderModel.firstCall.args[0]).to.equal(dashboard.name)
    })

    it('calls renderer with widgets', () => {
      expect(renderer.buildRenderModel.firstCall.args[1]).to.equal(dashboard.widgets)
    })

    it('calls renderer with layout', () => {
      expect(renderer.buildRenderModel.firstCall.args[2]).to.equal(dashboard.layout)
    })
  })
})
