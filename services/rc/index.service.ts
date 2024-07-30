'use strict';
import { createSign } from 'crypto';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators';
import moment from 'moment';
import xml2json from 'xml2json';
import { throwNotFoundError } from '../../types';
import { SN_RC, SN_RC_STREETS } from '../../types/serviceNames';
import { handlePagination } from '../../utils';
import { RcStreet } from './streets.service';

// we need this function because XML object and array doesn't have any difference. It's better to check manually
function transformToArray(item: any | any[]) {
  if (!item) return [];

  if (Array.isArray(item)) {
    return item;
  }

  return [item];
}

const ACTION_TYPE = {
  NTR_KLASIFIKATORIAI: '700', // NTR klasifikatoriai
  NT_ADRESO_PAIESKA: '189', // NT objektų paieška pagal adresą
  NTR_ISRASAS: '95', // NTR išrašas
  GYVENTOJU_REGISTRAS: '589', // Lietuvos Respublikos gyventojų registras
};

const plotTypeId = '10'; // Žemės sklypas

@Service({
  name: SN_RC,
})
export default class extends moleculer.Service {
  @Action({
    timeout: 0,
    params: {
      streetCode: 'string|convert',
      plotOrBuildingNumber: 'string|convert',
      roomNumber: 'string|convert|optional',
    },
    rest: 'GET /plot',
  })
  async getPlot(ctx: Context<{ streetCode: string; plotOrBuildingNumber: string }>) {
    const { streetCode, plotOrBuildingNumber } = ctx.params;
    const items: any[] = await ctx.call(`${SN_RC}.getObjects`, {
      streetCode,
      plotOrBuildingNumber,
    });

    const plot = items?.find((item) => item.typeId === plotTypeId);

    if (!plot) return throwNotFoundError('Plot not found');

    const attributes: any = await ctx.call(`${SN_RC}.getObjectInfo`, {
      registrationNumber: plot.registrationNumber,
      registrationServiceNumber: plot.registrationServiceNumber,
      uniqueNumber: plot.uniqueNumber,
    });

    return { ...plot, attributes };
  }

  @Action({
    timeout: 0,
    params: {
      streetCode: 'string|convert',
      plotOrBuildingNumber: 'string|convert',
      roomNumber: 'string|convert|optional',
    },
    rest: 'GET /objects',
  })
  async getObjectsExpectPlot(
    ctx: Context<{
      streetCode: string;
      plotOrBuildingNumber: string;
      roomNumber?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    }>,
  ) {
    const { streetCode, plotOrBuildingNumber, roomNumber, search } = ctx.params;
    const items: any[] = await ctx.call(`${SN_RC}.getObjects`, {
      streetCode,
      plotOrBuildingNumber,
      roomNumber,
    });

    const itemsToReturn = items
      .filter((item) => item.typeId !== plotTypeId)
      .filter((item) => (search ? new RegExp(search, 'gi').test(item.uniqueNumber) : true))
      .sort((a, b) => a.uniqueNumber.localeCompare(b.uniqueNumber));

    return handlePagination({
      data: itemsToReturn,
      page: ctx.params.page || 1,
      pageSize: ctx.params.pageSize || 10,
    });
  }

  @Action({
    timeout: 0,
    params: {
      streetCode: 'string|convert',
      plotOrBuildingNumber: 'string|convert',
      roomNumber: 'string|convert|optional',
    },
  })
  async getObjects(
    ctx: Context<{
      streetCode: string;
      plotOrBuildingNumber: string;
      roomNumber: string;
    }>,
  ) {
    const { streetCode, plotOrBuildingNumber, roomNumber } = ctx.params;

    const rcStreet: RcStreet = await ctx.call(`${SN_RC_STREETS}.getByCode`, {
      code: streetCode,
    });

    if (!rcStreet?.id) {
      throwNotFoundError('Street cannot be found');
    }

    const params = {
      gat_id: rcStreet.id,
      namo_nr: plotOrBuildingNumber,
      buto_nr: roomNumber,
    };

    const data: any = await this.makeRequest(ACTION_TYPE.NT_ADRESO_PAIESKA, params);
    const ntrTypesById = await this.getNTRTypesById();

    return (
      transformToArray(data?.ADR_OBJEKTAI?.OBJEKTAS)?.map((item: any) => ({
        id: item.OBJ_ID,
        registrationNumber: item.REG_NR,
        registrationServiceNumber: item.REG_TARN_NR,
        uniqueNumber: item.UNIKALUS_NR,
        typeId: item.OBJE_TIPAS,
        typeName: item.OBJE_PAV_I,
        buildingPurpose: ntrTypesById[item.PASK_TIPAS],
      })) || []
    );
  }

  @Action({
    timeout: 0,
    params: {
      registrationNumber: 'string|convert',
      registrationServiceNumber: 'string|convert',
      uniqueNumber: 'string|convert',
    },
    rest: 'GET /objects/:registrationNumber/:registrationServiceNumber/:uniqueNumber',
  })
  async getObjectInfo(
    ctx: Context<{
      registrationNumber: string;
      registrationServiceNumber: string;
      uniqueNumber: string;
    }>,
  ) {
    const { registrationNumber, registrationServiceNumber, uniqueNumber } = ctx.params;
    const data: any = await this.makeRequest(ACTION_TYPE.NTR_ISRASAS, {
      rnr: registrationNumber,
      tnr: registrationServiceNumber,
      opt: 'L0.01001',
    });

    const objects = transformToArray(data?.REGISTRAS?.OBJEKTAI?.OBJEKTAS);

    const specificObject = objects.find((o) => o.UNIKALUS_NR === uniqueNumber);

    if (!specificObject) throwNotFoundError('Object not found');

    const attributesByCode = transformToArray(specificObject.ATRIBUTAS).reduce(
      (acc: any, item: any) => ({ ...acc, [item.kodas]: item }),
      {},
    );

    function getAttributeValue(code: number | string) {
      const attribute = attributesByCode[`${code}`];
      if (!attribute) return;

      return {
        value: attribute.REIKSME,
        unit: attribute.VIEN_ZYME,
      };
    }

    return {
      buildingArea: getAttributeValue(51), // Bendras plotas
      constructionDate: getAttributeValue(73), // Statybos pabaigos metai
      latestRenovationDate: getAttributeValue(74), // Rekonstravimo pabaigos metai
      plotArea: getAttributeValue(101), // Žemės sklypo plotas
      builtPlotArea: getAttributeValue(109), // Užstatyta teritorija
      energyClass: getAttributeValue(323), // Pastato (jo dalies) energinio naudingumo klasė
    };
  }

  @Action({
    timeout: 0,
    params: {
      personalCode: 'string|convert',
    },
  })
  async getPerson(ctx: Context<{ personalCode: string }>) {
    const data: any = await this.makeRequest(ACTION_TYPE.GYVENTOJU_REGISTRAS, {
      asm_kodas: ctx.params.personalCode,
    });

    const info = data?.personDetailInformation2;

    if (!info) throwNotFoundError();

    return {
      personalCode: info.ats_asm_kodas,
      firstName: info.ats_asm_vardas,
      lastName: info.ats_asm_pav,
      nationality: info.ats_pil,
    };
  }

  @Method
  async getNTRTypesById() {
    const dataTypes: any = await this.makeRequest(ACTION_TYPE.NTR_KLASIFIKATORIAI, {
      kla_kodas: 'PASKIRCIU_TIPAI',
    });

    const dataGroupsById: any = await this.getNTRGroupsById();

    return transformToArray(dataTypes?.ROWSET?.ROW)?.reduce((acc: any, item: any) => {
      let title = item.PASK_PAV;
      if (dataGroupsById?.[item.PASG_GRUPE]) {
        title = `${title} (${dataGroupsById[item.PASG_GRUPE]})`;
      }
      return { ...acc, [item.PASK_TIPAS]: title };
    }, {});
  }

  @Method
  async getNTRGroupsById() {
    const dataGroups: any = await this.makeRequest(ACTION_TYPE.NTR_KLASIFIKATORIAI, {
      kla_kodas: 'PASKIRCIU_GRUPES',
    });

    return transformToArray(dataGroups?.ROWSET?.ROW)?.reduce(
      (acc: any, item: any) => ({
        ...acc,
        [item.PASG_GRUPE]: item.PASG_PAV,
      }),
      {},
    );
  }

  @Method
  async makeRequest(actionType: string | number, params: { [key: string]: any }) {
    const date = moment().format('YYYY-MM-DD HH:mm:ss');
    const url = process.env.RC_API_URL;
    const callerCode = process.env.RC_CALLER_CODE;

    params = Object.keys(params).reduce((acc: any, key: string) => {
      if (!params[key]) return acc;

      return { ...acc, [key]: { $t: params[key] } };
    }, {});

    const argsXml = xml2json.toXml(params);
    const parameters = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><args>${argsXml}<fmt>xml</fmt></args>`;
    const stringToSign = `${actionType}${callerCode}${parameters}${date}`;

    const sign = createSign('SHA1');
    sign.write(stringToSign);
    sign.end();

    const signature_b64 = sign.sign(process.env.RC_PRIVATE_KEY, 'base64');

    const envelope = `<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="urn:http://www.registrucentras.lt">
      <soapenv:Header/>
      <soapenv:Body>
        <reg:GetData soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            <input xsi:type="reg:InputParams" xmlns:reg="http://www.registrucentras.lt">
              <ActionType xsi:type="xsd:string">${actionType}</ActionType>
              <Parameters xsi:type="xsd:string"><![CDATA[${parameters}]]></Parameters>
              <CallerCode xsi:type="xsd:string">${callerCode}</CallerCode>
              <Time xsi:type="xsd:string">${date}</Time>
              <Signature xsi:type="xsd:string">${signature_b64}</Signature>
            </input>
        </reg:GetData>
      </soapenv:Body>
    </soapenv:Envelope>`;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
      },
      body: envelope,
    })
      .then((r) => r.text())
      .then((r) => this.transformResponse(r))
      .catch((err) => {
        console.error(err);
      });
  }

  @Method
  transformResponse(response: any) {
    response = xml2json.toJson(response, { object: true });
    response =
      response?.['SOAP-ENV:Envelope']?.['SOAP-ENV:Body']?.['ns1:GetDataResponse']?.['return'];

    if (!response) return;

    const responseCode = response?.['ResponseCode']?.['$t'];
    const responseData = response?.['ResponseData']?.['$t'];
    if (responseCode === '-1') {
      return throwNotFoundError('', { message: responseData });
    } else if (responseCode === '0') {
      return;
    } else if (responseCode === '1') {
      if (!responseData) return;

      return xml2json.toJson(Buffer.from(responseData, 'base64').toString('utf-8'), {
        object: true,
      });
    }

    // fallback
    throwNotFoundError('Response code is not supported');
  }
}
