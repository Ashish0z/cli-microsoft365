import * as assert from 'assert';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { formatting } from '../../../../utils/formatting';
import { pid } from '../../../../utils/pid';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./report-pstncalls');

describe(commands.REPORT_PSTNCALLS, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;

  const jsonOutput = {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#Collection(microsoft.graph.callRecords.pstnCallLogRow)",
    "@odata.count": 1000,
    "value": [{
      "id": "9c4984c7-6c3c-427d-a30c-bd0b2eacee90",
      "callId": "1835317186_112562680@61.221.3.176",
      "userId": "db03c14b-06eb-4189-939b-7cbf3a20ba27",
      "userPrincipalName": "richard.malk@contoso.com",
      "userDisplayName": "Richard Malk",
      "startDateTime": "2019-11-01T00:00:08.2589935Z",
      "endDateTime": "2019-11-01T00:03:47.2589935Z",
      "duration": 219,
      "charge": 0.00,
      "callType": "user_in",
      "currency": "USD",
      "calleeNumber": "+1234567890",
      "usageCountryCode": "US",
      "tenantCountryCode": "US",
      "connectionCharge": 0.00,
      "callerNumber": "+0123456789",
      "destinationContext": null,
      "destinationName": "United States",
      "conferenceId": null,
      "licenseCapability": "MCOPSTNU",
      "inventoryType": "Subscriber"
    }],
    "@odata.nextLink": "https://graph.microsoft.com/v1.0/communications/callRecords/getPstnCalls(from=2019-11-01,to=2019-12-01)?$skip=1000"
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinonUtil.restore([
      appInsights.trackEvent,
      pid.getProcessName,
      auth.restoreAuth
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.REPORT_PSTNCALLS), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['id', 'calleeNumber', 'callerNumber', 'startDateTime']);
  });

  it('fails validation on invalid fromDateTime', async () => {
    const actual = await command.validate({
      options: {
        fromDateTime: 'abc'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation on invalid toDateTime', async () => {
    const actual = await command.validate({
      options: {
        fromDateTime: '2020-12-01',
        toDateTime: 'abc'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation on number of days between fromDateTime and toDateTme exceeding 90', async () => {
    const actual = await command.validate({
      options: {
        fromDateTime: '2020-08-01',
        toDateTime: '2020-12-01'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation on valid fromDateTime', async () => {
    const validfromDateTime: any = new Date();
    //fromDateTime should be less than 90 days ago for passing validation
    validfromDateTime.setDate(validfromDateTime.getDate() - 70);
    const actual = await command.validate({
      options: {
        fromDateTime: validfromDateTime.toISOString().substr(0, 10)
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation on valid fromDateTime and toDateTime', async () => {
    const actual = await command.validate({
      options: {
        fromDateTime: '2020-11-01',
        toDateTime: '2020-12-01'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('gets pstncalls in teams', async () => {
    const requestStub: sinon.SinonStub = sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/communications/callRecords/getPstnCalls(fromDateTime=2019-11-01,toDateTime=2019-12-01)`) {
        return Promise.resolve(jsonOutput);
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { debug: false, fromDateTime: '2019-11-01', toDateTime: '2019-12-01' } });
    assert.strictEqual(requestStub.lastCall.args[0].url, "https://graph.microsoft.com/v1.0/communications/callRecords/getPstnCalls(fromDateTime=2019-11-01,toDateTime=2019-12-01)");
    assert.strictEqual(requestStub.lastCall.args[0].headers["accept"], 'application/json;odata.metadata=none');
  });

  it('gets pstncalls in teams with no toDateTime specified', async () => {
    const now = new Date();
    const fakeTimers = sinon.useFakeTimers(now);
    const toDateTime: string = formatting.encodeQueryParameter(now.toISOString());

    const requestStub: sinon.SinonStub = sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/communications/callRecords/getPstnCalls(fromDateTime=2019-11-01,toDateTime=${toDateTime})`) {
        return Promise.resolve(jsonOutput);
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { debug: false, fromDateTime: '2019-11-01' } });
    assert.strictEqual(requestStub.lastCall.args[0].url, `https://graph.microsoft.com/v1.0/communications/callRecords/getPstnCalls(fromDateTime=2019-11-01,toDateTime=${toDateTime})`);
    assert.strictEqual(requestStub.lastCall.args[0].headers["accept"], 'application/json;odata.metadata=none');
    fakeTimers.restore();
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'get').callsFake(() => Promise.reject('An error has occurred'));

    await assert.rejects(command.action(logger, { options: { debug: false, fromDateTime: '2019-11-01', toDateTime: '2019-12-01' } } as any), new CommandError('An error has occurred'));
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach((o: any) => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});