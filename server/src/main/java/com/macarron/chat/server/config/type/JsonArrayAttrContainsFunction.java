package com.macarron.chat.server.config.type;

import org.hibernate.QueryException;
import org.hibernate.dialect.function.SQLFunction;
import org.hibernate.engine.spi.Mapping;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.StandardBasicTypes;
import org.hibernate.type.Type;

import java.util.List;

/**
 * function for jsonb contains: jsonattr->>field like '%somestr%' <br/>
 * example: <br/>
 * cb.function("array_attr_contains", Boolean.class, <br/>
 * &nbsp;&nbsp; root.get("detailInfo"), <br/>
 * &nbsp;&nbsp; cb.literal("macs"), <br/>
 * &nbsp;&nbsp; cb.literal("%" + value + "%")
 **/
public class JsonArrayAttrContainsFunction implements SQLFunction {
    @Override
    public boolean hasArguments() {
        return true;
    }

    @Override
    public boolean hasParenthesesIfNoArguments() {
        return true;
    }

    @Override
    public Type getReturnType(Type firstArgumentType, Mapping mapping) throws QueryException {
        return StandardBasicTypes.BOOLEAN;
    }

    @Override
    public String render(Type firstArgumentType, List args, SessionFactoryImplementor factory) throws QueryException {
        if (args.size() != 3) {
            throw new QueryException("array_attr_contains() requires three arguments");
        }

        Object field = args.get(0);
        Object attr = args.get(1);
        Object value = args.get(2);

        return field + "::jsonb->>" + attr + " like " + value;
    }
}
