import { ServiceBroker } from 'moleculer';
import RequestMixin from '../../mixins/request.mixin';

describe("Test 'requests' mixin", () => {
  const DatabaseMixin = {
    methods: {
      validateParams: jest.fn(),
      updateEntity: jest.fn(),
      createEntity: jest.fn(),
      removeEntity: jest.fn(),
    },
  };

  describe('1:1 relations', () => {
    describe('relation on remote', () => {
      const broker = new ServiceBroker({ logger: false });
      beforeAll(() => broker.start());
      afterAll(() => broker.stop());
      const sportsPersonsService = broker.createService({
        name: 'sportsPersons',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            name: 'string|required',
            athlete: {
              type: 'object',
              virtual: true,
              requestHandler: {
                service: 'athletes',
                relationField: 'sportsPerson',
              },
            },
          },
        },
      });

      const athletesService = broker.createService({
        name: 'athletes',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            sportsPerson: 'number|required',
            foo: 'string|required',
          },
        },
      });

      it('should validate sub-entity passing instance id', async () => {
        athletesService.validateParams = jest.fn();

        await sportsPersonsService.actions.applyOrValidateRequestChanges({
          entity: {
            athlete: {
              foo: 'bar',
            },
          },
          oldEntity: {},
          apply: false,
        });

        expect(athletesService.validateParams).toHaveBeenCalledTimes(1);
        const athleteParams = athletesService.validateParams.mock.calls[0][1];
        expect(athleteParams.foo).toBe('bar');
        expect(typeof athleteParams.sportsPerson).toBe('number');
      });
    });

    describe('relation on host', () => {
      const broker = new ServiceBroker({ logger: false });
      beforeAll(() => broker.start());
      afterAll(() => broker.stop());
      const sportsPersonsService = broker.createService({
        name: 'sportsPersons',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            name: 'string|required',
            athlete: {
              type: 'number',
              requestHandler: {
                service: 'athletes',
              },
            },
          },
        },
      });

      const athletesService = broker.createService({
        name: 'athletes',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            foo: 'string|required',
          },
        },
      });

      it('should validate sub-entity', async () => {
        athletesService.validateParams = jest.fn();
        sportsPersonsService.validateParams = jest.fn();

        await sportsPersonsService.actions.applyOrValidateRequestChanges({
          entity: {
            athlete: {
              foo: 'bar',
            },
          },
          oldEntity: {},
          apply: false,
        });

        expect(athletesService.validateParams).toHaveBeenCalledTimes(1);
        const athleteParams = athletesService.validateParams.mock.calls[0][1];
        expect(athleteParams.foo).toBe('bar');
        expect(typeof athleteParams.sportsPerson).toBe('undefined');

        const sportsPersonsParams = sportsPersonsService.validateParams.mock.calls[0][1];
        expect(sportsPersonsService.validateParams).toHaveBeenCalledTimes(1);
        expect(typeof sportsPersonsParams.athlete).toBe('number');
      });
    });
  });

  describe('1:n relations', () => {
    describe('relation on remote', () => {
      const broker = new ServiceBroker({ logger: false });
      beforeAll(() => broker.start());
      afterAll(() => broker.stop());
      const sportsPersonsService = broker.createService({
        name: 'sportsPersons',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            name: 'string|required',
            athletes: {
              type: 'array',
              virtual: true,
              requestHandler: {
                service: 'athletes',
                relationField: 'sportsPerson',
              },
            },
          },
        },
      });

      const athletesService = broker.createService({
        name: 'athletes',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            sportsPerson: 'number|required',
            foo: 'string|required',
          },
        },
      });

      it('should validate sub-entity passing instance id', async () => {
        athletesService.validateParams = jest.fn();

        await sportsPersonsService.actions.applyOrValidateRequestChanges({
          entity: {
            athletes: [
              {
                foo: 'bar',
              },
              {
                foo2: 'bar2',
              },
            ],
          },
          oldEntity: {},
          apply: false,
        });

        expect(athletesService.validateParams).toHaveBeenCalledTimes(2);
        const athleteParams = athletesService.validateParams.mock.calls[0][1];
        expect(athleteParams.foo).toBe('bar');
        expect(typeof athleteParams.sportsPerson).toBe('number');
      });
    });

    describe('relation on host', () => {
      const broker = new ServiceBroker({ logger: false });
      beforeAll(() => broker.start());
      afterAll(() => broker.stop());
      const sportsPersonsService = broker.createService({
        name: 'sportsPersons',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            name: 'string|required',
            athletes: {
              type: 'array',
              items: 'number',
              requestHandler: {
                service: 'athletes',
              },
            },
          },
        },
      });

      const athletesService = broker.createService({
        name: 'athletes',
        mixins: [RequestMixin, DatabaseMixin],
        settings: {
          fields: {
            id: 'number',
            foo: 'string|required',
          },
        },
      });

      it('should validate sub-entity', async () => {
        athletesService.validateParams = jest.fn();
        sportsPersonsService.validateParams = jest.fn();

        await sportsPersonsService.actions.applyOrValidateRequestChanges({
          entity: {
            athletes: [
              {
                foo: 'bar',
              },
              {
                foo2: 'bar2',
              },
            ],
          },
          oldEntity: {},
          apply: false,
        });

        expect(athletesService.validateParams).toHaveBeenCalledTimes(2);
        const athleteParams = athletesService.validateParams.mock.calls[0][1];
        expect(athleteParams.foo).toBe('bar');
        expect(typeof athleteParams.sportsPerson).toBe('undefined');

        const sportsPersonsParams = sportsPersonsService.validateParams.mock.calls[0][1];
        expect(sportsPersonsService.validateParams).toHaveBeenCalledTimes(1);
        expect(sportsPersonsParams.athletes).toBeInstanceOf(Array);
      });
    });
  });
});
