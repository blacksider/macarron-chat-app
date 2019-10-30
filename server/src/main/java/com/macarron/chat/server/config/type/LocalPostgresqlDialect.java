package com.macarron.chat.server.config.type;

import org.hibernate.dialect.PostgreSQL95Dialect;
import org.hibernate.dialect.function.SQLFunctionTemplate;
import org.hibernate.type.StandardBasicTypes;

public class LocalPostgresqlDialect extends PostgreSQL95Dialect {

    public LocalPostgresqlDialect() {
        super();
        registerFunction("regex", new SQLFunctionTemplate(StandardBasicTypes.BOOLEAN, "?1 ~ ?2"));
        registerFunction("contains_json", new SQLFunctionTemplate(StandardBasicTypes.BOOLEAN, "?1::jsonb @> ?2::jsonb"));
        registerFunction("contains_json_attr", new SQLFunctionTemplate(StandardBasicTypes.BOOLEAN, "jsonb_exists(?1::jsonb, ?2)"));
        registerFunction("extract_epoch", new ExtractEpochFunction());
        registerFunction("now_with_timezone", new NowWithTimezoneFunction());
        registerFunction("array_attr_contains", new JsonArrayAttrContainsFunction());
    }
}
